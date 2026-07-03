import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert';
import { parse } from 'csv-parse';
import { dbClientWrapper } from '../utils.mjs';
import { convert2PositiveInt } from './utils.mjs';
import { lookupOldUsers } from './users.mjs';
import { lookupCharacters } from './characters.mjs';
import { formatDate } from './utils.mjs';

const __dirname = new URL(path.dirname(import.meta.url)).pathname;
export const command = 'posts <data_dir>';
export const describe = 'migrate posts from v1';
export { builder } from './utils.mjs';
export const handler = dbClientWrapper(migratePosts);

export async function migratePosts(client, argv) {
  await initV1Binding(client);
  const { verbose } = argv;
  const { default: config } = await import('config');
  const schema = config.scope;

  const parser = parse({ columns: true, delimiter: ',' });
  const ar_posts_path = path.resolve(process.cwd(), argv.data_dir, 'ar_post.csv');

  verbose && console.log('Reading v1 post from', ar_posts_path);
  fs.createReadStream(ar_posts_path, 'utf-8').pipe(parser);

  const posts = [];
  for await (const row of parser) {
    const post = convertPost(row);
    const { old_id, is_deleted, status } = post;
    if (is_deleted) {
      verbose && console.info(`Post id ${old_id} is deleted, skip.`);
      continue;
    }

    if (['published', 'private'].includes(status) === false) {
      verbose && console.info(`Post id ${old_id} status is ${status}, skip.`);
      continue;
    }

    posts.push(post);
  }

  const oldCidSet = new Set(posts.map((p) => p.old_character_id));
  const charactersMap = await lookupCharacters(client, schema, Array.from(oldCidSet));

  for (const post of posts) {
    const {
      old_id, old_character_id,
      status, images,
      subject, content,
      social,
      created_at, updated_at,
    } = post;

    const character = charactersMap.get(old_character_id);
    if (!character) {
      console.error(`Post id ${old_id} character id ${old_character_id} not found`);
      continue;
    }
    const { id: cid, owner_id } = character;
    const imagesMap = await initCharacterAssets(client, schema, cid, owner_id, images);
    const imageIds = images.map((img) => imagesMap.get(img));

    await client.query(
      `WITH binding AS (
        INSERT INTO v1.posts (old_id, id)
        VALUES ($1, GEN_RANDOM_UUID())
        ON CONFLICT (old_id) DO NOTHING
        RETURNING id
      ),
      post_id AS (
        SELECT id FROM binding
        UNION
        SELECT id FROM v1.posts WHERE old_id = $1
      )
      INSERT INTO ${schema}.posts
      (id, uid, cid,
      subject, content, images, social,
      status, created_at, updated_at)
      SELECT id, $2, $3,
      $4, $5, $6, $7,
      $8, $9, $10
      FROM post_id
      ON CONFLICT (id) DO UPDATE SET
        subject = EXCLUDED.subject,
        content = EXCLUDED.content,
        images = EXCLUDED.images,
        social = EXCLUDED.social,
        status = EXCLUDED.status`,
      [
        old_id, owner_id, cid,
        subject, content, imageIds, social,
        status, created_at, updated_at,
      ]
    );

    verbose && console.log(`Post id ${old_id} migrated.`);
  }

  await migratePostComments(client, argv);
}


export async function migratePostComments(client, argv) {
  const { verbose } = argv;
  const { default: config } = await import('config');
  const schema = config.scope;

  const user_csv = path.join(argv.data_dir, 'ar_post_comment.csv');
  const parser = parse({ columns: true, delimiter: ',' });
  fs.createReadStream(user_csv, 'utf-8').pipe(parser);

  const comments = [];
  const commentIdsSet = new Set();
  const userIdsSet = new Set();
  const characterIdsSet = new Set();

  for await (const row of parser) {
    const comment = formatComment(row);
    const { is_deleted } = comment;

    if (is_deleted) {
      verbose && console.warn(`skipping deleted comment id=${comment.old_id}`);
      continue;
    }

    comments.push(comment);
    commentIdsSet.add(comment.old_id);
    if (comment.role_type === 'user') {
      userIdsSet.add(comment.old_user_id);
    } else if (comment.role_type === 'character') {
      characterIdsSet.add(comment.old_user_id);
    }
  }

  await client.query(
    `INSERT INTO v1.post_comments (old_id, id)
    SELECT UNNEST($1::BIGINT[]), GEN_RANDOM_UUID()
    ON CONFLICT (old_id) DO NOTHING`,
    [Array.from(commentIdsSet)]
  );

  const userIdsMaps = await lookupOldUsers(client, schema, Array.from(userIdsSet));
  // const characterIdsMaps = await lookupCharacters(client, Array.from(characterIdsSet));

  for (const comment of comments) {
    const {
      old_id, old_post_id, old_user_id,
      content, old_parent_id,
      role_type, createdAt, updatedAt
    } = comment;

    if (role_type !== 'user') {
      verbose && console.warn(`skipping comment id=${old_id} with role_type=${role_type}`);
      continue;
    }

    const uid = userIdsMaps.get(old_user_id)?.id;
    if (!uid) {
      console.error(`comment id=${old_id} user_id=${old_user_id} not found`);
      continue;
    }

    await client.query(
      `WITH comment_id AS (
        SELECT id FROM v1.post_comments WHERE old_id = $1
      ),
      reply_to AS (
        SELECT id AS reply_to_id FROM v1.post_comments WHERE old_id = $2
      )
      INSERT INTO ${schema}.post_comments
      (
        id, reply_to_id, pid, uid,
        content, created_at, updated_at
      )
      SELECT
        comment.id, reply_to_id, v1.posts.id, $4,
        $5, $6, $7
      FROM comment_id AS comment
      JOIN v1.posts ON v1.posts.old_id = $3
      LEFT JOIN reply_to ON reply_to_id IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content`,
      [
        old_id, old_parent_id, old_post_id, uid,
        content, createdAt, updatedAt
      ]
    );
  }
}

async function initV1Binding(client) {
  const bootstrapSQL = await fs.promises.readFile(
    path.join(__dirname, '../..', 'db/v1', 'posts.sql'),
    'utf-8'
  );

  await client.query(bootstrapSQL);
}

/**
 * @description ar_post.csv columns:
 * id,user_id,character_id,
 * image, img_height,img_width,
 * title,content,
 * like_count,favorite_count,comment_count,
 * status,
 * weight,
 * createtime,updatetime,deletetime
 */


function convertPost(row) {
  const {
    id: old_id,
    user_id: old_user_id,
    character_id: old_character_id,
    image,
    like_count, favorite_count, comment_count,
    title,
    content,
    createtime, updatetime, deletetime,
  } = row;

  const images = image.split(',').filter((img) => img !== '');
  const status = convertStatus(row.status);

  return {
    old_id,
    old_user_id,
    old_character_id,
    status,

    images,
    subject: title, content,

    social: {
      like: convert2PositiveInt(like_count),
    },

    created_at: formatDate(createtime),
    updated_at: formatDate(updatetime),
    is_deleted: deletetime !== '',
  };
}

function convertStatus(status) {
  switch (status) {
  case '1':
    return 'reviewing';
  case '2':
    return 'rejected';
  case '3':
    return 'published';
  case '4':
    return 'private';
  default:
    throw new Error(`Unknown post status: ${status}`);
  }
}

async function initCharacterAssets(client, schema, cid, uid, images) {
  images = Array.from(new Set(images));

  const { rows } = await client.query(
    `WITH images AS (
      SELECT UNNEST($1::TEXT[]) AS url, $2::UUID AS cid
    ),
    assets_id AS (
      SELECT id, url
      FROM images
      LEFT JOIN ${schema}.characters_images USING(cid, url)
    ),
    insert AS (
      INSERT INTO ${schema}.characters_images
      (url, cid, uid, source)
      SELECT url, $2, $3, 'post' FROM assets_id WHERE id IS NULL
      RETURNING id, url
    )
    SELECT id, url FROM assets_id WHERE id IS NOT NULL
    UNION
    SELECT id, url FROM insert`,
    [images, cid, uid]
  );

  assert(rows.length === images.length, 'Some character assets are missing');

  const assetsMap = new Map();
  for (const row of rows) {
    assetsMap.set(row.url, row.id);
  }
  return assetsMap;
}

/**
 *
 * @description ar_post_comment.csv columns:
 * id,post_id,content,user_id,pid,
 * reply_user_id,role_type,reply_role_type,
 * createtime,updatetime,deletetime
 *
 */

function formatComment(row) {
  const {
    id: old_id,
    post_id: old_post_id,
    content,
    user_id: old_user_id,
    pid: old_parent_id,
    reply_user_id: old_reply_user_id,
    reply_role_type,
    deletetime
  } = row;

  const createdAt = formatDate(row.createtime);
  const updatedAt = formatDate(row.updatetime);

  const is_deleted = deletetime !== '';

  const role_type = row.role_type === '1' ? 'user' : 'character';

  return {
    is_deleted,
    old_id,
    old_post_id,
    content,
    old_user_id,
    old_parent_id,
    old_reply_user_id,
    role_type,
    createdAt,
    updatedAt
  };
}