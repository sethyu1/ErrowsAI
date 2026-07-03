import { Client } from "pg";
import {
  POST_IMAGE,
  ASSET_IMAGE_SUMMARY,
  CHARACTER_IMAGE_GEN_SETTING,
  ASSET_BASE,
  ASSET_IMAGE_GEN_TASK_NOT_COMPLETE,
  ASSET_VIDEO,
  ASSET_VIDEO_SUMMARY,
  ASSET_VIDEO_GEN_TASK_NOT_COMPLETE,
  LIST_ASSETS_PARAMS
} from "@errows/types";
import { CHARACTER_IMAGES_SOURCES } from "./constrains.js";
import { ModelError } from "./utils.js";

export class MEDIA_MODEL_ERROR extends ModelError<
| 'IMAGE_NOT_FOUND'
| 'VIDEO_NOT_FOUND'
| 'VIDEO_TASK_NOT_FOUND'
> {}

// 获取图片列表
export async function listImages(
  client: Client, schema: string,
  ids: string[] = []
): Promise<POST_IMAGE[]> {

  const { rows } = await client.query(
    `SELECT
      id, cid, uid, url
     FROM "${schema}".characters_images
     JOIN (SELECT * FROM UNNEST($1::UUID[]) WITH ORDINALITY id) AS ids USING (id)
     ORDER BY ordinality`,
    [ids]
  );

  return rows;
}

function buildSortClause(
  sortCauses: string[],
  sort: LIST_ASSETS_PARAMS['sort']
): void {
  if (sort === 'count') {
    sortCauses.push('count DESC');
  } else if (sort === 'alphabetical') {
    sortCauses.push(`(character.attributes ->> 'name') ASC`);
  }
  sortCauses.push('media.created_at DESC');
}

function buildSearchClause(
  data: unknown[],
  whereCauses: string[],
  q: string
): void {
  if ((q ?? '').length == 0) {
    return;
  }

  data.push(q);
  const idx = data.length;
  whereCauses.push(
    `((character.attributes ->> 'name') ILIKE '%' || $${idx} || '%')`
  );
}

function buildFilterClause(
  data: unknown[],
  whereCauses: string[],
  filters: LIST_ASSETS_PARAMS['filters'] = []
): void {
  if (filters.length === 0) {
    return;
  }

  for (const [key, values] of filters) {
    const idx = data.length;
    data.push(values);
    if (key === 'gender') {
      whereCauses.push(
        `((character.attributes ->> 'gender') = ANY($${idx}::TEXT[]))`
      );
      continue;
    }

    whereCauses.push(
      `(
        EXISTS (
          SELECT 1
          FROM JSONB_ARRAY_ELEMENTS_TEXT(character.attributes -> 'tags') AS tag
          WHERE tag = ANY($${idx}::TEXT[])
        )
        OR
        EXISTS (
          SELECT 1
          FROM JSONB_ARRAY_ELEMENTS_TEXT(character.attributes -> 'character_search_tags') AS tag
          WHERE tag = ANY($${idx}::TEXT[])
        )
      )`
    );
  }
}

function buildStatusClause(
  whereCauses: string[],
  status: LIST_ASSETS_PARAMS['status']
): void {
  if (status === 'deleted') {
    whereCauses.push(`character.status = 'deleted'`);
  }
}

// 获取用户的角色图片列表
export async function listImagesByUser(
  client: Client, schema: string,
  uid: string, params: LIST_ASSETS_PARAMS
): Promise<
  (Omit<ASSET_IMAGE_SUMMARY, 'character'> & { cid: string })[]
> {
  const data = [uid];
  const sortCauses: string[] = [];
  const whereCauses: string[] = [];

  buildSearchClause(data, whereCauses, params.q);
  buildFilterClause(data, whereCauses, params.filters);
  buildStatusClause(whereCauses, params.status);
  buildSortClause(sortCauses, params.sort);

  const { rows } = await client.query(
    `SELECT cid, media.cover, count FROM (
      SELECT cid, count(*) FROM "${schema}".characters_images
      WHERE uid = $1 AND source != '${CHARACTER_IMAGES_SOURCES.POST_USER_UPLOAD}'
        AND deleted_at IS NULL
      GROUP BY cid
    ) AS counts
    JOIN LATERAL (
      SELECT DISTINCT ON (cid)
        cid, url AS cover, created_at
      FROM "${schema}".characters_images
      WHERE uid = $1 AND source != '${CHARACTER_IMAGES_SOURCES.POST_USER_UPLOAD}'
        AND deleted_at IS NULL
      ORDER BY cid, created_at DESC
    ) AS media USING (cid)
    JOIN "${schema}".characters AS character ON character.id = cid
    ${whereCauses.length > 0 ? `WHERE ${whereCauses.join(' AND ')}` : ''}
    ORDER BY ${sortCauses.join(', ')}`,
    data
  );

  return rows.map((res) => ({
    ...res,
    count: parseInt(res.count, 10),
  }));
}

// 获取和当前用户相关角色的图片列表
export async function listImagesByCharacter(
  client: Client, schema: string,
  cid: string, uid: string,
  query: { sort: string, order: 'asc' | 'desc' }
) : Promise<{ count: number, data: ASSET_BASE[] }> {
  const order = query.order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { rows } = await client.query(
    `SELECT
      count(*) OVER() AS count,
      id, url, created_at, created_at
     FROM "${schema}".characters_images
     WHERE cid = $1 AND source != '${CHARACTER_IMAGES_SOURCES.POST_USER_UPLOAD}'
      AND uid = $2 AND deleted_at IS NULL
     ORDER BY created_at ${order}`,
    [cid, uid]
  );

  return rows.reduce( (acc, { count, ...res }, index) => {
    if (index === 0) {
      acc.count = parseInt(count, 10);
    }
    acc.data.push( res );
    return acc;
  }, { count: 0, data: [] as ASSET_BASE[] } )
}


// 获取图片信息
export async function getImageById(
  client: Client, schema: string,
  id: string
): Promise<ASSET_BASE> {
  const { rows: [res = null] } = await client.query(
    `SELECT
      id, url, created_at, created_at
     FROM "${schema}".characters_images
     WHERE id = $1`,
    [id]
  );

  if (res === null) {
    throw new MEDIA_MODEL_ERROR('IMAGE_NOT_FOUND');
  }

  return res;
}

export async function getCharacterSysImage(
  client: Client, schema: string,
  cid: string
): Promise<{ url: string } | null> {
  const { rows: [res = null] } = await client.query<{ url: string }>(
    `SELECT url
     FROM "${schema}".characters_images
     WHERE cid = $1 AND source = 'sys' AND deleted_at IS NULL
     ORDER BY created_at ASC
     LIMIT 1`,
    [cid]
  );

  return res;
}

// 创建图像生成任务
export async function createImageGenerationTask(
  client: Client, schema: string,
  cid: string, uid: string, image_id: string,
  setting: CHARACTER_IMAGE_GEN_SETTING
): Promise<{ id: string }> {
  const { rows: [res] } = await client.query(
    `INSERT INTO "${schema}".characters_image_gen_tasks
    (id, cid, uid, setting)
    VALUES ($1, $2, $3, $4)
    RETURNING id`,
    [image_id, cid, uid, setting]
  );

  return res;
}

// 完成图像生成任务
export async function completeImageGeneration(
  client: Client, schema: string,
  cid: string, uid: string, task_id: string,
  image_url: string
): Promise<void> {
  const { rows: [res] } = await client.query(
    `WITH add_image_media AS (
      INSERT INTO "${schema}".characters_images
      (id, cid, uid, url, source, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING url
    )
    UPDATE "${schema}".characters_image_gen_tasks
    SET
      status = 'completed',
      updated_at = NOW()
    FROM add_image_media
    WHERE id = $1 AND cid = $2 AND uid = $3
    RETURNING id`,
    [task_id, cid, uid, image_url, CHARACTER_IMAGES_SOURCES.GENERATION]
  );

  if (!res) {
    throw new MEDIA_MODEL_ERROR('IMAGE_NOT_FOUND');
  }
}

// 保存聊天中生成的图片
export async function saveSessionGeneratedImage(
  client: Client, schema: string,
  cid: string, uid: string,
  image_id: string, image_url: string
): Promise<{ id: string }> {
  const { rows: [res] = [] } = await client.query(
    `INSERT INTO "${schema}".characters_images
    (id, cid, uid, url, source)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id`,
    [image_id, cid, uid, image_url, CHARACTER_IMAGES_SOURCES.SESSION_IMAGE]
  );

  return res;
}



// 获取图像生成任务
export async function getImageGenerationTask(
  client: Client, schema: string,
  cid: string, uid: string, task_id: string
) {
  const { rows: [res = null] } = await client.query(
    `SELECT
      id, cid, uid, setting, status,
      created_at, updated_at
     FROM "${schema}".characters_image_gen_tasks
     WHERE id = $1 AND uid = $2 AND cid = $3`,
    [task_id, uid, cid]
  );

  if (res === null) {
    throw new MEDIA_MODEL_ERROR('IMAGE_NOT_FOUND');
  }

  return res;
}

// 获取图像生成任务列表
export async function listImageGenTasks(
  client: Client, schema: string,
  cid: string, uid: string
): Promise<ASSET_IMAGE_GEN_TASK_NOT_COMPLETE[]> {

  const { rows } = await client.query<ASSET_IMAGE_GEN_TASK_NOT_COMPLETE>(
    `SELECT
      id, cid, uid, setting, status,
      created_at, updated_at
     FROM "${schema}".characters_image_gen_tasks
     WHERE cid = $1 AND uid = $2 AND status != 'completed'
     ORDER BY created_at DESC`,
    [cid, uid]
  );

  return rows;
}

// 获取用户的角色视频列表
export async function listVideosByUser(
  client: Client, schema: string,
  uid: string, params: LIST_ASSETS_PARAMS
): Promise<(Omit<ASSET_VIDEO_SUMMARY, 'character'> & { cid: string })[]> {
  const data = [uid];
  const whereCauses: string[] = [];
  const sortCauses: string[] = [];
  buildSearchClause(data, whereCauses, params.q);
  buildFilterClause(data, whereCauses, params.filters);
  buildStatusClause(whereCauses, params.status);
  buildSortClause(sortCauses, params.sort);

  const { rows } = await client.query(
    `SELECT cid, media.cover, count FROM (
      SELECT cid, count(*) FROM "${schema}".characters_videos
      WHERE uid = $1 AND deleted_at IS NULL
      GROUP BY cid
    ) AS counts
    JOIN LATERAL (
      SELECT DISTINCT ON (cid)
        videos.cid, images.url AS cover, videos.created_at
      FROM "${schema}".characters_videos videos
      JOIN "${schema}".characters_images images ON videos.image_id = images.id
      WHERE videos.uid = $1 AND videos.deleted_at IS NULL
      ORDER BY videos.cid, videos.created_at DESC
    ) AS media USING (cid)
    JOIN "${schema}".characters AS character ON character.id = cid
    ${whereCauses.length > 0 ? `WHERE ${whereCauses.join(' AND ')}` : ''}
    ORDER BY ${sortCauses.join(', ')}`,
    data
  );

  return rows.map((res) => ({
    ...res,
    count: parseInt(res.count, 10),
  }));
}



// 获取和当前用户相关角色的视频列表
export async function listVideosByCharacter(
  client: Client, schema: string,
  cid: string, uid: string, query: { sort: string, order: 'asc' | 'desc' }
): Promise<{ count: number, data: ASSET_VIDEO[]}> {
  const order = query.order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { rows } = await client.query(
    `SELECT
      count(*) OVER() AS count,
      videos.id, videos.url AS url, images.url AS cover,
      videos.created_at
     FROM "${schema}".characters_videos AS videos
     JOIN "${schema}".characters_images AS images ON image_id = images.id
     WHERE videos.cid = $1 AND videos.uid = $2 AND videos.deleted_at IS NULL
     ORDER BY videos.created_at ${order}`,
    [cid, uid]
  );

  return rows.reduce( (acc, { count, ...res }, index) => {
    if (index === 0) {
      acc.count = parseInt(count, 10);
    }
    acc.data.push( res );
    return acc;
  }, { count: 0, data: [] as ASSET_VIDEO[] } )
}

// 获取视频信息
export async function getVideoById(
  client: Client, schema: string,
  id: string, uid: string
): Promise<ASSET_VIDEO> {

  const { rows: [res = null] } = await client.query(
    `SELECT
      videos.id,
      videos.url AS url, images.url AS cover,
      videos.created_at
     FROM "${schema}".characters_videos videos
     JOIN "${schema}".characters_images images ON image_id = images.id
     WHERE videos.id = $1 AND videos.uid = $2`,
    [id, uid]
  );

  if (res === null) {
    throw new MEDIA_MODEL_ERROR('VIDEO_NOT_FOUND');
  }

  return res;
}

// 创建视频生成任务
export async function createVideoGenerationTask(
  client: Client, schema: string,
  task_id: string,
  cid: string, uid: string,
  image_id: string,
): Promise<{ id: string }> {

  const { rows: [res] } = await client.query(
    `INSERT INTO "${schema}".characters_video_gen_tasks
      (id, cid, uid, image_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, status, cid, uid, image_id`,
    [task_id, cid, uid, image_id]
  );

  return res;
}

// 开始视频生成任务
export async function startVideoGeneration(
  client: Client, schema: string,
  cid: string, uid: string, task_id: string,
  task_info: unknown
): Promise<void> {
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters_video_gen_tasks
    SET
      info = $4,
      status = 'generating',
      updated_at = NOW()
    WHERE id = $1 AND cid = $2 AND uid = $3
    RETURNING id`,
    [task_id, cid, uid, task_info]
  );

  if (!res) {
    throw new MEDIA_MODEL_ERROR('VIDEO_TASK_NOT_FOUND');
  }
}

export async function failVideoGenTask(
  client: Client, schema: string,
  cid: string, uid: string, tid: string,
  error: Error
): Promise<void> {

  const errMsg = error instanceof Error ? error.message : String(error);
  const { rows: [res = null] } = await client.query(
    `UPDATE "${schema}".characters_video_gen_tasks
    SET
      info = COALESCE(info, '{}'::jsonb) || jsonb_build_object('error', $4::text),
      status = 'failed',
      updated_at = NOW()
    WHERE id = $1 AND cid = $2 AND uid = $3
    RETURNING id`,
    [tid, cid, uid, errMsg]
  );

  if (res === null) {
    throw new MEDIA_MODEL_ERROR('VIDEO_TASK_NOT_FOUND');
  }
}

// 获取视频生成任务
export async function getVideoGenerationTask(
  client: Client, schema: string,
  cid: string, uid: string, tid: string
) {
  const { rows: [res = null] } = await client.query(
    `SELECT
      id, cid, uid, status,
      image_id, cover,
      info,
      created_at, updated_at
     FROM "${schema}".characters_video_gen_tasks video_gen_tasks
     JOIN LATERAL (
      SELECT url AS cover
      FROM "${schema}".characters_images
      WHERE image_id = characters_images.id
     ) AS images ON true
     WHERE id = $1 AND uid = $2 AND cid = $3`,
    [tid, uid, cid]
  );

  if (res === null) {
    throw new MEDIA_MODEL_ERROR(
      'VIDEO_TASK_NOT_FOUND',
      'Video generation task not found',
      { cid, uid, tid }
    );
  }

  return res;
}

// 列出当前用户具体角色的未完成的视频生成任务列表
export async function listNotCompletedVideoGenTasks(
  client: Client, schema: string,
  cid: string, uid: string
): Promise<ASSET_VIDEO_GEN_TASK_NOT_COMPLETE[]> {

  const { rows } = await client.query(
    `SELECT
      id, cid, uid, status,
      image_id, cover,
      created_at, updated_at
    FROM "${schema}".characters_video_gen_tasks
    JOIN LATERAL (
        SELECT url AS cover
        FROM "${schema}".characters_images
        WHERE image_id = characters_images.id
     ) AS images ON true
     WHERE cid = $1 AND uid = $2 AND status != 'completed'
     ORDER BY created_at ASC`,
    [cid, uid]
  );

  return rows;
}


// 完成视频生成任务
export async function completeVideoGenTask(
  client: Client, schema: string,
  cid: string, uid: string, task_id: string,
  video_url: string, info: unknown
): Promise<void> {

  const { rows: [res] } = await client.query(
    `WITH completed AS (
      UPDATE "${schema}".characters_video_gen_tasks
      SET
        info = $5,
        status = 'completed',
        updated_at = NOW()
      WHERE id = $1 AND cid = $2 AND uid = $3
      RETURNING id, cid, uid, image_id
    )
    INSERT INTO "${schema}".characters_videos
    (id, cid, uid, image_id, url)
    SELECT id, cid, uid, image_id, $4
    FROM completed
    RETURNING id`,
    [task_id, cid, uid, video_url, info]
  );

  if (!res) {
    throw new MEDIA_MODEL_ERROR('VIDEO_TASK_NOT_FOUND');
  }
}

// 删除图片（软删除）
export async function deleteImage(
  client: Client, schema: string,
  cid: string, uid: string, aid: string
): Promise<void> {
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters_images
     SET deleted_at = NOW()
     WHERE id = $1 AND cid = $2 AND uid = $3 AND deleted_at IS NULL
     RETURNING id`,
    [aid, cid, uid]
  );

  if (!res) {
    throw new MEDIA_MODEL_ERROR('IMAGE_NOT_FOUND');
  }
}

// 删除视频（软删除）
export async function deleteVideo(
  client: Client, schema: string,
  cid: string, uid: string, vid: string
): Promise<void> {
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters_videos
     SET deleted_at = NOW()
     WHERE id = $1 AND cid = $2 AND uid = $3 AND deleted_at IS NULL
     RETURNING id`,
    [vid, cid, uid]
  );

  if (!res) {
    throw new MEDIA_MODEL_ERROR('VIDEO_NOT_FOUND');
  }
}