import path from 'node:path';
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { dbClientWrapper } from '../utils.mjs';
import { formatDate } from './utils.mjs';
import { lookupOldUsers } from './users.mjs';
import { lookupCharacters } from './characters.mjs';

const __dirname = new URL(path.dirname(import.meta.url)).pathname;

export const command = 'media <data_dir>';
export const describe = 'migrate media data from v1';
export const builder = {
  data_dir: {
    describe: 'Path to v1 data directory',
    type: 'string',
    demandOption: true
  }
};

export const handler = dbClientWrapper(migrateMedia);
export async function migrateMedia(client, argv) {
  await initV1Map(client);

  const { default: config } = await import('config');
  const schema = config.scope;

  const media_csv = path.join(argv.data_dir, 'ar_generate_img_record.csv');
  const parser = parse({ columns: true, delimiter: ',' });
  fs.createReadStream(media_csv, 'utf-8').pipe(parser);

  const oldIds = new Set();
  const mediaItems = [];
  const userIdsSet = new Set();
  const characterIdsSet = new Set();
  for await (const row of parser) {
    const mediaItem = formatMedia(row);
    const { is_deleted } = mediaItem;
    if (is_deleted) {
      continue;
    }
    userIdsSet.add(mediaItem.old_user_id);
    characterIdsSet.add(mediaItem.old_character_id);
    oldIds.add(mediaItem.old_id);
    mediaItems.push(mediaItem);
  }

  const userIdMap = await lookupOldUsers(client, schema, Array.from(userIdsSet));
  const charactersMap = await lookupCharacters(
    client, schema, Array.from(characterIdsSet)
  );

  await client.query(
    `INSERT INTO v1.media (old_id, id)
     SELECT UNNEST($1::BIGINT[]), GEN_RANDOM_UUID()
     ON CONFLICT (old_id) DO NOTHING`,
    [Array.from(oldIds)]
  );

  for (const mediaItem of mediaItems) {
    const {
      old_id, old_user_id, old_character_id,
      img_url, video_url, request_id,
      created_at, updated_at
    } = mediaItem;

    const user = userIdMap.get(old_user_id);
    if (!user) {
      console.error(`Media id ${old_id} user id ${old_user_id} not found`);
      continue;
    }
    const uid = user.id;
    const character = charactersMap.get(old_character_id);
    if (!character) {
      console.error(`Media id ${old_id} character id ${old_character_id} not found`);
      continue;
    }

    await client.query(
      `INSERT INTO ${schema}.characters_images
      (id, uid, cid, url, source, created_at)
      SELECT
        media_record.id, $2, $3,
        $4, 'generated', $5
      FROM (SELECT id FROM v1.media WHERE old_id = $1) media_record
      ON CONFLICT (id) DO UPDATE SET
        url = EXCLUDED.url`,
      [
        old_id, uid, character.id,
        img_url, created_at
      ]
    );

    if (video_url === "") {
      continue;
    }

    await client.query(
      `WITH
      media_record AS (
        SELECT id FROM v1.media WHERE old_id = $1
      ),
      video_task AS (
        INSERT INTO ${schema}.characters_video_gen_tasks
          (id, image_id, uid, cid, status, info, created_at, updated_at)
        SELECT id, id, $2, $3, 'completed', $5, $6, $7
        FROM media_record
        ON CONFLICT (id) DO NOTHING
        RETURNING id, image_id, uid, cid, created_at
      )
      INSERT INTO ${schema}.characters_videos
      (id, image_id, uid, cid, url, created_at)
      SELECT id, image_id, uid, cid, $4, created_at
      FROM video_task
      ON CONFLICT (id) DO UPDATE SET
        url = EXCLUDED.url`,
      [
        old_id, uid, character.id,
        video_url, { request_id },
        created_at, updated_at
      ]
    );
  }
}

async function initV1Map(client) {
  const bootstrapSQL = await fs.promises.readFile(
    path.join(__dirname, '../..', 'db/v1', 'media.sql'),
    'utf-8'
  );

  await client.query(bootstrapSQL);
}

/**
 *
 * @description ar_generate_image_record.csv columns:
 * id, user_id, character_id
 * img_url, status, video_url, video_time, request_id
 * createtime, updatetime, deletetime
 *
 */
function formatMedia(row) {
  const {
    id: old_id, user_id: old_user_id,
    character_id: old_character_id,
    img_url, status, video_url,
    video_time, request_id,
    createtime, updatetime, deletetime
  } = row;

  const is_deleted = deletetime !== '';


  return {
    old_id, old_user_id, old_character_id,
    img_url, video_url,
    created_at: formatDate(createtime),
    updated_at: formatDate(updatetime),
    is_deleted,
  };
}