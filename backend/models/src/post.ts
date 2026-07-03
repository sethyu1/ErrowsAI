import { Client } from "pg";
import { ModelError } from "./utils.js";
import { POST } from "@errows/types";

export class POST_MODEL_ERROR extends ModelError<
| 'POST_NOT_FOUND'
> {}

// 创建帖子（仅 content 一个文本字段）
export async function create(
  client: Client, schema: string,
  cid: string, uid: string,
  content: string,
  images: string[]
): Promise<{ id: string }> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO ${schema}.posts
    (cid, uid, content, images, status)
     VALUES ($1, $2, $3, $4, 'published')
     RETURNING id`,
    [cid, uid, content, images]
  );

  return rows[0] as { id: string };
}

// 格式化帖子社交数据
function formatSocial(social: Partial<POST['social']> | null): POST['social'] {
  const defaultSocial = {
    likes_count: 0, dislikes_count: 0,
    comments_count: 0
  };
  return Object.assign({}, defaultSocial, social);
}
// 获取帖子详情
export async function get(
  client: Client, schema: string,
  pid: string
): Promise<POST> {
  const { rows: [res = null] } = await client.query<POST>(
    `SELECT
      id, cid, posts.uid,
      content, images, social, feedback,
      COALESCE(comments, '[]'::JSONB) AS comments,
      posts.created_at, updated_at
     FROM "${schema}".posts
     LEFT JOIN "${schema}".post_feedback ON id = pid
     LEFT JOIN LATERAL (
        SELECT
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'id', post_comments.id,
              'reply_to_id', post_comments.reply_to_id,
              'uid', post_comments.uid,
              'content', post_comments.content,
              'created_at', post_comments.created_at,
              'updated_at', post_comments.updated_at
            ) ORDER BY post_comments.created_at ASC
          ) AS comments
        FROM "${schema}".post_comments
        WHERE pid = $1
        GROUP BY pid
     ) AS post_comments ON TRUE
     WHERE id = $1`,
    [pid]
  );

  if (res === null) {
    throw new POST_MODEL_ERROR('POST_NOT_FOUND');
  }

  return Object.assign(
    {}, res,
    { social: formatSocial(res.social) }
  );
}

// 构建角色ID过滤条件
function buildCIdFilter(data: unknown[], cid: string | null) {
  if (cid === null) {
    return { where: '1 = 1' };
  }

  data.push(cid);
  const idx = data.length;

  return {
    where: `cid = $${idx}`,
  };
}

// 获取帖子列表
export async function list(
  client: Client, schema: string, uid: string | null,
  query: {
    page: number, size: number, cid?: string,
    sort: 'created_at' | 'random',
    order?: number | 'desc' | 'asc'
  }
) {
  const { page, size, cid = null, sort, order = 'desc' } = query;
  const offset = size * page;

  const data = [size, offset, uid];
  const { where: cid_where } = buildCIdFilter(data, cid);

  const sortBy = sort === 'random' ? 'RANDOM()' : 'created_at';
  if (sort === 'random') {
    await client.query(`SELECT SETSEED($1::FLOAT)`, [order]);
  }

  const { rows } = await client.query<POST & { count: string }>(
    `SELECT
      COUNT(*) OVER() AS count,
      id, cid, posts.uid,
      content, images, social, feedback,
      posts.created_at, updated_at
    FROM "${schema}".posts
    LEFT JOIN "${schema}".post_feedback
      ON id = pid AND post_feedback.uid = $3
    WHERE status = 'published' AND ${cid_where}
    ORDER BY ${sortBy} ${order === 'desc' ? 'DESC' : 'ASC'}
    LIMIT $1 OFFSET $2`,
    data
  );

  return rows.reduce( (acc, { count, social, ...res }, index) => {
    if (index === 0) {
      acc.count = parseInt(count, 10);
    }
    acc.posts.push(Object.assign(
      {}, res,
      { social: formatSocial(social) }
    ));
    return acc;
  }, { count: 0, posts: [] as POST[] } );
}

// 删除帖子
export async function del(
  client: Client, schema: string,
  pid: string, cid: string, uid: string
) {
  const { rowCount } = await client.query(
    `UPDATE ${schema}.posts
      SET status = 'deleted', updated_at = NOW()
    WHERE id = $1 AND cid = $2 AND uid = $3 AND status != 'deleted'`,
    [pid, cid, uid]
  );

  if (rowCount === 0) {
    throw new POST_MODEL_ERROR('POST_NOT_FOUND');
  }
}

// 对帖子进行反馈（点赞/不喜欢）
export async function feedback(
  client: Client, schema: string,
  pid: string, uid: string, feedback: 'like' | 'dislike'
): Promise<void> {
    const [old_fb, new_fb, like_delta, dislike_delta] = [
    [null, 'like', 1, 0],
    [null, 'dislike', 0, 1],
    ['like', null, -1, 0],
    ['like', 'dislike', -1, 1],
    ['dislike', 'like', 1, -1],
    ['dislike', null, 0, -1],
  ].reduce(
    (acc, [old_fb, new_fb, like_delta, dislike_delta]) => {
      acc[0].push(old_fb as string | null);
      acc[1].push(new_fb as string | null);
      acc[2].push(like_delta as number);
      acc[3].push(dislike_delta as number);
      return acc;
    },
    [[], [], [], []] as [
      old_fb: (string | null)[], new_fb: (string | null)[],
      like_delta: number[], dislike_delta: number[]
    ]
  );

  const { rows } = await client.query<
    { feedback: 'like' | 'dislike' }
  >(
    `WITH
    delete_old AS (
      DELETE FROM "${schema}".post_feedback
      WHERE pid = $1 AND uid = $2
      RETURNING pid, feedback
   ),
    update_post AS (
      INSERT INTO
        "${schema}".post_feedback (pid, uid, feedback)
      SELECT
        data.pid, uid, data.feedback
      FROM
        (VALUES ($1, $2, $3)) AS data(pid, uid, feedback)
      LEFT JOIN
        delete_old ON data.pid = delete_old.pid
      WHERE
        delete_old.feedback IS DISTINCT FROM data.feedback
      RETURNING pid, feedback
    )
    UPDATE "${schema}".posts AS p
    SET
      social = social || JSONB_BUILD_OBJECT(
        'dislikes_count',
        COALESCE((social -> 'dislikes_count')::INT, 0) + deltas.dislike_delta,
        'likes_count',
        COALESCE((social -> 'likes_count')::INT, 0) + deltas.like_delta
      ),
      updated_at = NOW()
    FROM (
      SELECT delete_old.feedback AS old_fb,
      update_post.feedback AS new_fb
      FROM delete_old
      FULL JOIN update_post ON delete_old.pid = update_post.pid
    ) AS fb_change
    JOIN LATERAL (
      SELECT like_delta, dislike_delta
      FROM
        UNNEST($4::TEXT[], $5::TEXT[], $6::INT[], $7::INT[])
        AS t(old_fb, new_fb, like_delta, dislike_delta)
      WHERE fb_change.old_fb IS NOT DISTINCT FROM t.old_fb
        AND fb_change.new_fb IS NOT DISTINCT FROM t.new_fb
    ) AS deltas ON TRUE
    WHERE p.id = $1
    RETURNING like_delta, dislike_delta`,
    [pid, uid, feedback, old_fb, new_fb, like_delta, dislike_delta]
  );

  if (rows.length === 0) {
    throw new POST_MODEL_ERROR('POST_NOT_FOUND');
  }
}

// 创建帖子评论
export async function comment_create(
  client: Client, schema: string,
  pid: string, uid: string,
  reply_to_id: string | null,
  content: string
): Promise<{ id: string }> {
  const { rows } = await client.query<{ id: string }>(
    `WITH increase_comment_count AS (
      UPDATE "${schema}".posts
      SET social = social || JSONB_BUILD_OBJECT(
        'comments_count',
        COALESCE((social -> 'comments_count')::INT, 0) + 1
      ),
      updated_at = NOW()
      WHERE id = $1
      RETURNING id
    )
    INSERT INTO "${schema}".post_comments
      (pid, uid, reply_to_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING id`,
    [pid, uid, reply_to_id, content]
  );

  if (rows.length === 0) {
    throw new POST_MODEL_ERROR('POST_NOT_FOUND');
  }

  return rows[0] as { id: string };
}

// 根据用户ID删除其所有帖子
export async function deleteByOwnerId(
  client: Client, schema: string,
  uid: string
): Promise<void> {
  await client.query(
    `UPDATE ${schema}.posts
      SET status = 'deleted', updated_at = NOW()
    WHERE uid = $1 AND status != 'deleted'`,
    [uid]
  );

  await client.query(
    `DELETE FROM ${schema}.post_comments WHERE uid = $1`,
    [uid]
  );
}