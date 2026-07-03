import { Client } from "pg";
import { ModelError } from "./utils.js";
import {
  CHARACTER, CHARACTER_SETTING,
  CHARACTER_STYLE, CHARACTER_IDENTITY, CHARACTER_DIALOGUE,
  POST_IMAGE,
  CHARACTER_LIST_PARAMS,
  CHARACTER_MODEL_PARAMS
} from "@errows/types";
import { CHARACTER_IMAGES_SOURCES } from "./constrains.js";

const SPECIAL_OWNER_ID = 'dddcf8f7-9396-4b7f-8829-d773799ea999';

const IDENTITY_KEYS = new Set([
  'nickname', 'introduction',
  'gender', 'type', 'assortment',
  'race', 'color', 'age'
]);

const DIALOGUE_KEYS = new Set([
  'voice', 'settings',
  'greeting', 'personality',
  'scenario', 'conversation'
]);

const BUILD_IN_KEYS = new Set([
  'id', 'status', 'owner_id',
  'avatar_url', 'social',
  'created_at', 'updated_at',
  'is_official',
  'ncover',
]);

function normGender(val: unknown): string | null {
  if (val == null) return null;
  const v = String(val).trim().toLowerCase();
  if (v === 'male' || v === 'm' || v === 'man') return 'Male';
  if (v === 'female' || v === 'f' || v === 'woman') return 'Female';
  return v ? 'Male' : null;
}

function normCategory(val: unknown): string | null {
  if (val == null) return null;
  const v = String(val).trim().toLowerCase();
  if (v === 'realistic') return 'Realistic';
  if (v === 'anime') return 'Anime';
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : null;
}

function findParamValue(params: unknown[] | null | undefined, key: string): unknown {
  if (!params || !Array.isArray(params)) return null;
  for (const item of params) {
    const o = item as Record<string, unknown> | null;
    if (o && o.key === key && 'value' in o) return o.value;
  }
  return null;
}

export type ATTRIBUTES = {
  name?: string | null;
  age?: string | null;
  description?: string | null;
  personality?: string | string[] | null;
  scenario?: string | null;
  first_mes?: string | null;
  mes_example?: { user: string; character: string }[] | null;
  creator_notes?: string | null;
  system_prompt?: string | null;
  post_history_instrutions?: string | null;
  alternate_greetings?: string | null;
  tags?: string[] | null;
  creator?: string | null;
  character_version?: string | null;
  body?: string[] | null;
  gender?: string | null;
  category?: string | null;
  Introduction?: string | null;
  un_office_value?: {
    base_model?: string | null;
    lora?: unknown;
    lora_strength?: unknown;
    base_prompt?: string | null;
  } | null;
  character_search_tags?: string[] | null;
  voice?: string | null;
};
export class CHARACTER_MODEL_ERROR extends ModelError<
  | 'CHARACTER_NOT_FOUND'
> { }

export function attributesToSetting(attrs: ATTRIBUTES | null): Record<string, unknown> {
  if (!attrs || typeof attrs !== 'object') return {};
  const params = (attrs.un_office_value as Record<string, unknown>) || {};
  const paramsOverride = {
    personality: attrs.personality,
    body: attrs.body,
    base_model: params.base_model,
    lora: params.lora,
    lora_strength: params.lora_strength,
    base_prompt: params.base_prompt,
  };
  const paramsList = attrs.scenario != null ? [{ key: 'scenario', value: attrs.scenario }] : [];
  return {
    nickname: attrs.name,
    introduction: attrs.Introduction,
    gender: attrs.gender,
    type: attrs.category?.toLowerCase() ?? undefined,
    settings: attrs.description,
    greeting: attrs.first_mes,
    conversation: attrs.mes_example,
    voice: attrs.voice,
    tags: attrs.tags,
    s_tags: attrs.character_search_tags,
    personality: attrs.personality,
    scenario: attrs.scenario,
    body: attrs.body,
    params: paramsList,
    params_override: paramsOverride,
  };
}

export function convertToDBSetting(
  data: CHARACTER_SETTING & Record<string, unknown>
): { attributes: ATTRIBUTES } {
  const [style, identity, dialogue] = Object.entries(data)
    .reduce(
      (acc, [key, value]) => {
        if (BUILD_IN_KEYS.has(key)) return acc;
        if (IDENTITY_KEYS.has(key)) Object.assign(acc[1], { [key]: value });
        else if (DIALOGUE_KEYS.has(key)) Object.assign(acc[2], { [key]: value });
        else Object.assign(acc[0], { [key]: value });
        return acc;
      },
      [{} as Record<string, unknown>, {} as Record<string, unknown>, {} as Record<string, unknown>]
    );

  const styleWithSTags = style as { tags?: string[]; s_tags?: string[] };
  if (Array.isArray(styleWithSTags.tags)) {
    const originalTags = styleWithSTags.tags;
    const originalSTags = Array.isArray(styleWithSTags.s_tags) ? styleWithSTags.s_tags : [];
    styleWithSTags.s_tags = originalSTags.concat(originalTags);
    styleWithSTags.tags = [];
  }

  const params = (data as { params?: unknown[] }).params;
  const paramsOverride = (data as { params_override?: Record<string, unknown> }).params_override || {};
  const scenario = findParamValue(params, 'scenario');

  const attributes: ATTRIBUTES = {
    name: (identity.nickname as string) ?? null,
    age: (identity.age as string) ?? null,
    description: (dialogue.settings as string) ?? null,
    personality: ((): string | string[] | null => {
      const p = paramsOverride.personality ?? (dialogue as Record<string, unknown>).personality;
      return typeof p === 'string' || Array.isArray(p) ? p : null;
    })(),
    scenario: (scenario as string) ?? null,
    first_mes: (dialogue.greeting as string) ?? null,
    mes_example: Array.isArray(dialogue.conversation) ? dialogue.conversation as { user: string; character: string }[] : null,
    creator_notes: null,
    system_prompt: null,
    post_history_instrutions: null,
    alternate_greetings: null,
    tags: (style.tags as string[]) ?? null,
    creator: null,
    character_version: null,
    body: (paramsOverride.body as string[]) ?? null,
    gender: normGender(identity.gender),
    category: normCategory(identity.type),
    Introduction: (identity.introduction as string) ?? null,
    un_office_value: {
      base_model: (paramsOverride.base_model as string) ?? null,
      lora: paramsOverride.lora ?? null,
      lora_strength: paramsOverride.lora_strength ?? null,
      base_prompt: (paramsOverride.base_prompt as string) ?? null,
    },
    character_search_tags: (style.s_tags as string[]) ?? null,
    voice: (dialogue.voice as string) ?? null,
  };

  return { attributes };
}

export async function create(
  client: Client, schema: string,
  uid: string, cid: string,
  character: CHARACTER_SETTING & Record<string, unknown>,
  is_official: boolean = false,
  ncover: number = 1
): Promise<{ id: string }> {
  const { attributes } = convertToDBSetting(character);
  const { rows: [res] } = await client.query(
    `INSERT INTO "${schema}".characters
    (id, owner_id, attributes, is_official, ncover)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id`,
    [
      cid,
      uid,
      JSON.stringify(attributes),
      is_official,
      ncover,
    ]
  );

  return res!;
}

export async function getSetting(
  client: Client, schema: string, cid: string
): Promise<CHARACTER_SETTING & CHARACTER_MODEL_PARAMS> {
  const { rows: [res = null] } = await client.query(
    `SELECT
      id, owner_id, avatar_url, greeting_image, background_image_files, attributes,
      is_official,
      created_at, updated_at
     FROM "${schema}".characters
     WHERE id = $1`,
    [cid]
  );

  if (res === null) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }

  const attrs = res.attributes as ATTRIBUTES | null;
  const flat = attributesToSetting(attrs);
  const { is_official, ...rest } = res;
  return { ...flat, is_official: !!is_official, ...rest } as CHARACTER_SETTING & CHARACTER_MODEL_PARAMS;
}

export async function updateSetting(
  client: Client, schema: string, cid: string, uid: string,
  character: Partial<CHARACTER_SETTING> & Record<string, unknown>
): Promise<void> {
  const current = await getSetting(client, schema, cid);
  const merged = { ...current, ...character };
  const { attributes } = convertToDBSetting(merged as CHARACTER_SETTING);
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters
    SET
      attributes = $3::jsonb,
      updated_at = NOW()
    WHERE id = $1 AND owner_id = $2
    RETURNING id`,
    [cid, uid, JSON.stringify(attributes)]
  );

  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
}

export async function getSettingsForOps(
  client: Client, schema: string, cid: string
): Promise<{ attributes: ATTRIBUTES; avatar_url: string | null; greeting_image: string | null; background_image_files: string | null; ncover: number | null }> {
  const { rows: [res = null] } = await client.query(
    `SELECT attributes, avatar_url, greeting_image, background_image_files, ncover
     FROM "${schema}".characters WHERE id = $1`,
    [cid]
  );
  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
  return {
    attributes: (res.attributes as ATTRIBUTES) ?? {},
    avatar_url: res.avatar_url as string | null,
    greeting_image: res.greeting_image as string | null,
    background_image_files: res.background_image_files as string | null,
    ncover: res.ncover as number | null,
  };
}

export async function updateSettingOps(
  client: Client, schema: string, cid: string,
  payload: { attributes?: ATTRIBUTES; avatar_url?: string | null; greeting_image?: string | null; background_image_files?: string | null; ncover?: number | null }
): Promise<void> {
  const updates: string[] = ['updated_at = NOW()'];
  const values: unknown[] = [cid];
  let idx = 2;
  if (payload.attributes !== undefined) {
    updates.push(`attributes = $${idx}::jsonb`);
    values.push(JSON.stringify(payload.attributes));
    idx++;
  }
  if (payload.avatar_url !== undefined) {
    updates.push(`avatar_url = $${idx}`);
    values.push(payload.avatar_url);
    idx++;
  }
  if (payload.greeting_image !== undefined) {
    updates.push(`greeting_image = $${idx}`);
    values.push(payload.greeting_image);
    idx++;
  }
  if (payload.background_image_files !== undefined) {
    updates.push(`background_image_files = $${idx}`);
    values.push(payload.background_image_files);
    idx++;
  }
  if (payload.ncover !== undefined) {
    updates.push(`ncover = $${idx}`);
    values.push(payload.ncover);
  }
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters SET ${updates.join(', ')} WHERE id = $1 RETURNING id`,
    values
  );
  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
}

const INIT_SOCIAL = {
  comments_count: 0,
  likes_count: 0,
  followed_count: 0,
  posted_count: 0,
  dialogues_count: 0,
  video_count: 0,
  intimacy_score: 0,
};

function formatCharacterRow(res: Record<string, unknown>): CHARACTER {
  const { attributes, social, greeting_image, background_image_files, ...rest } = res;
  const attrs = attributes as ATTRIBUTES | null;
  const flat = attrs && typeof attrs === 'object' ? attributesToSetting(attrs) : {};
  return {
    ...(rest as Record<string, unknown>),
    social: Object.assign({}, INIT_SOCIAL, social),
    nickname: attrs?.name ?? '',
    introduction: attrs?.Introduction ?? '',
    gender: (attrs?.gender ?? '') as string,
    type: (attrs?.category?.toLowerCase() ?? '') as string,
    voice: attrs?.voice ?? '',
    greeting_image: greeting_image as string | undefined,
    background_image_files: background_image_files as string | undefined,
    ...flat,
  } as unknown as CHARACTER;
}

export async function get(
  client: Client, schema: string, cid: string,
  uid: string | null
): Promise<CHARACTER> {
  const { rows: [res = null] } = await client.query(
    `SELECT
      id, owner_id, attributes, avatar_url, status, social, ncover,
      greeting_image, background_image_files,
      liked, followed,
      created_at, updated_at
     FROM "${schema}".characters
     LEFT JOIN LATERAL (
      SELECT COUNT(*) = 1::BIGINT AS liked
      FROM "${schema}".characters_likes
      WHERE characters.id = characters_likes.cid
        AND characters_likes.uid = $2
    ) likes ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) = 1::BIGINT AS followed
      FROM "${schema}".characters_follows
      WHERE characters.id = characters_follows.cid
        AND characters_follows.uid = $2
    ) follows ON true
     WHERE id = $1`,
    [cid, uid]
  );

  if (res === null) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }

  return formatCharacterRow(res);
}

// 完成角色头像生成
export async function completeGeneration(
  client: Client, schema: string,
  cid: string, uid: string, image_url: string
): Promise<void> {
  const { rows: [res] } = await client.query(
    `WITH add_image_media AS (
      INSERT INTO "${schema}".characters_images
      (id, cid, uid, url, source, created_at)
      VALUES ($1, $1, $2, $3, $4, NOW())
      RETURNING url
    )
    UPDATE "${schema}".characters
    SET
      avatar_url = add_image_media.url,
      status = 'private',
      updated_at = NOW()
    FROM add_image_media
    WHERE id = $1 AND status != 'deleted'
    RETURNING id`,
    [cid, uid, image_url, CHARACTER_IMAGES_SOURCES.AVATAR_GENERATION]
  );

  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
}

// 保存更新后的头像
export async function saveRebuildAvatar(
  client: Client, schema: string,
  cid: string, uid: string,
  image_id: string, image_url: string
): Promise<void> {
  const { rows: [res] } = await client.query(
    `WITH add_image_media AS (
      INSERT INTO "${schema}".characters_images
      (cid, uid, id, url, source)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING url
    )
    UPDATE "${schema}".characters
    SET
      avatar_url = add_image_media.url,
      status = 'private',
      updated_at = NOW()
    FROM add_image_media
    WHERE id = $1 AND status != 'deleted'
    RETURNING id`,
    [cid, uid, image_id, image_url, CHARACTER_IMAGES_SOURCES.AVATAR_REBUILD]
  );

  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
}


// 构建拥有者查询条件
function buildOwnerClause(
  data: unknown[],
  whereClauses: string[],
  owner_id: string | null
) {
  if (owner_id === null) {
    return;
  }
  data.push(owner_id);
  const idx = data.length;
  whereClauses.push(`owner_id = $${idx}`);
}

// 构建状态查询条件
function buildStatusClause(
  data: unknown[],
  whereClauses: string[],
  status: string | null,
  include_pending: boolean
) {
  if (include_pending === false) {
    whereClauses.push(`status != 'pending'`);
  }
  if (status === null) {
    whereClauses.push(`status != 'deleted'`);
    return;
  }

  data.push(status);
  const idx = data.length;
  whereClauses.push(`status = $${idx}`);
}

// 构建推荐过滤条件
function buildRecommendedClause(
  whereClauses: string[],
  recommended: boolean | null | undefined
) {
  if (recommended === true) {
    whereClauses.push(`recommended = true`);
  }
}

function buildOrderClause(
  orderClauses: string[],
  sort: CHARACTER_LIST_PARAMS['sort'] | null = null,
  useTablePrefix: boolean = false
) {
  const useDefaultOrderFirst = sort === null;
  const ts = useTablePrefix ? 'characters.' : '';
  const defaultOrderExpr = `(CASE WHEN default_order IS NULL OR default_order = 0 THEN -1 ELSE default_order END)`;
  if (useDefaultOrderFirst) {
    orderClauses.push(`${defaultOrderExpr} DESC`);
    orderClauses.push(`(social ->> 'followed_count')::BIGINT DESC NULLS LAST`);
  }

  if (sort === 'alphabetical') {
    orderClauses.push(`(attributes -> 'name') ASC`);
  } else if (sort === 'newest') {
    orderClauses.push(`${ts}updated_at DESC`);
  } else if (sort === 'most_liked') {
    orderClauses.push(`(social ->> 'likes_count')::BIGINT DESC NULLS LAST`);
  } else if (sort === 'popular') {
    orderClauses.push(`(CASE WHEN owner_id = '${SPECIAL_OWNER_ID}' THEN 0 ELSE 1 END) ASC`);
    orderClauses.push(`(CASE WHEN owner_id = '${SPECIAL_OWNER_ID}' AND (attributes->>'gender') IS DISTINCT FROM 'Male' AND female_rank <= 5 THEN female_rank - 1 WHEN owner_id = '${SPECIAL_OWNER_ID}' AND (attributes->>'gender') IS DISTINCT FROM 'Male' AND female_rank > 5 THEN 2 * female_rank - 7 WHEN owner_id = '${SPECIAL_OWNER_ID}' AND (attributes->>'gender') = 'Male' THEN 4 + 2 * male_rank ELSE NULL END) ASC NULLS LAST`);
    orderClauses.push(`(social ->> 'followed_count')::BIGINT DESC NULLS LAST`);
  }

  if (!useDefaultOrderFirst) {
    orderClauses.push(`${defaultOrderExpr} DESC`);
  }

  orderClauses.push(`${ts}created_at DESC`);
}

// 构建搜索条件
function buildSearchClause(
  data: unknown[],
  whereClauses: string[],
  q: string | null
) {
  if (q === null) {
    return;
  }
  data.push(q);
  const idx = data.length;
  whereClauses.push(`((attributes ->> 'name') ILIKE ('%' || $${idx} || '%'))`);
}

const TAG_TO_STYLE_STAG_MAP: Record<string, string> = {
  'Errows World': 'ErrowsWorld',
  'Anime World': 'AnimeWorld',
};

function buildCharacterSearchTagsClause(
  data: unknown[],
  whereClauses: string[],
  values: string[]
) {
  if (values.length === 0) return;
  const normalized = values.map((v) => (TAG_TO_STYLE_STAG_MAP[v] ?? v).toLowerCase());
  const unique = [...new Set(normalized)];
  data.push(unique);
  const idx = data.length;
  whereClauses.push(
    `(EXISTS (
      SELECT 1 FROM JSONB_ARRAY_ELEMENTS_TEXT(
        CASE WHEN jsonb_typeof(COALESCE(attributes -> 'character_search_tags', '[]'::jsonb)) = 'array'
        THEN COALESCE(attributes -> 'character_search_tags', '[]'::jsonb)
        ELSE '[]'::jsonb END
      ) AS tag
      WHERE LOWER(tag) = ANY($${idx}::TEXT[])
    ))`
  );
}

function buildTagClause(
  data: unknown[],
  whereClauses: string[],
  _type: 'identity' | 'dialogue' | 'style',
  _key: string,
  values: string[]
) {
  buildCharacterSearchTagsClause(data, whereClauses, values);
}

function buildStyleArrayTagClause(
  data: unknown[],
  whereClauses: string[],
  _key: string,
  values: string[]
) {
  buildCharacterSearchTagsClause(data, whereClauses, values);
}

function buildTagsOrClause(
  data: unknown[],
  whereClauses: string[],
  _identityTags: Record<string, string[]>,
  sTags: string[]
) {
  buildCharacterSearchTagsClause(data, whereClauses, sTags);
}

// 构建点赞过滤条件
function buildLikedByClause(
  schema: string,
  data: unknown[],
  joinClauses: string[],
  liked_by: string | null
) {
  if (liked_by === null) {
    return;
  }
  data.push(liked_by);
  const idx = data.length;
  joinClauses.push(
    `JOIN "${schema}".characters_likes
      ON characters.id = characters_likes.cid AND characters_likes.uid = $${idx}`
  );
}

// 构建关注过滤条件
function buildFollowedByClause(
  schema: string,
  data: unknown[],
  joinClauses: string[],
  followed_by: string | null
) {
  if (followed_by === null) {
    return;
  }
  data.push(followed_by);
  const idx = data.length;
  joinClauses.push(
    `JOIN "${schema}".characters_follows
      ON characters.id = characters_follows.cid AND characters_follows.uid = $${idx}`
  );
}
interface CHARACTER_LIST_PARAMS_INTER extends CHARACTER_LIST_PARAMS {
  owner_id?: string | null;
  status?: 'private' | 'public' | 'deleted';
  liked_by?: string | null;
  followed_by?: string | null;
  include_pending?: boolean;
}

// 获取角色列表
export async function list(
  client: Client, schema: string, uid: string | null,
  params: CHARACTER_LIST_PARAMS_INTER
): Promise<{ count: number, data: CHARACTER[] }> {
  const {
    page = 0, size = 10,
    owner_id = null, status = null, q = null,
    liked_by = null, followed_by = null,
    sort = 'latest',
    include_pending = true,
    recommended = null,
    tags = []
  } = params;
  const skip = page * size;

  const data = [skip, size, uid];
  const joinClauses: string[] = [];
  const whereClauses: string[] = [];
  const orderClauses: string[] = [];
  buildOwnerClause(data, whereClauses, owner_id);
  buildLikedByClause(schema, data, joinClauses, liked_by);
  buildFollowedByClause(schema, data, joinClauses, followed_by);
  buildStatusClause(data, whereClauses, status, include_pending);
  buildRecommendedClause(whereClauses, recommended);
  buildSearchClause(data, whereClauses, q);
  buildOrderClause(orderClauses, sort, joinClauses.length > 0 && sort !== 'popular');
  for (const [type, values] of tags) {
    if (type === 'tags') {
      const allTagValues = values.map((v) => TAG_TO_STYLE_STAG_MAP[v] ?? v);
      buildTagsOrClause(data, whereClauses, {}, allTagValues);
    } else {
      if (type === 's_tags') {
        buildStyleArrayTagClause(data, whereClauses, type, values);
      } else {
        let tag: 'identity' | 'dialogue' | 'style' = 'style';
        if (IDENTITY_KEYS.has(type as string)) {
          tag = 'identity';
        }
        if (DIALOGUE_KEYS.has(type as string)) {
          tag = 'dialogue';
        }
        buildTagClause(data, whereClauses, tag, type, values);
      }
    }
  }

  const baseFrom = `FROM "${schema}".characters
    LEFT JOIN LATERAL (
      SELECT COUNT(*) = 1::BIGINT AS liked
      FROM "${schema}".characters_likes
      WHERE characters.id = characters_likes.cid
        AND characters_likes.uid = $3
    ) likes ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) = 1::BIGINT AS followed
      FROM "${schema}".characters_follows
      WHERE characters.id = characters_follows.cid
        AND characters_follows.uid = $3
    ) follows ON true
    ${joinClauses.join('\n')}
    WHERE ${whereClauses.join(' AND ')}`;

  const hasJoins = joinClauses.length > 0;
  const cols = hasJoins && sort !== 'popular'
    ? 'characters.id, characters.owner_id, characters.attributes, characters.avatar_url, characters.status, characters.social, characters.ncover, characters.default_order, characters.greeting_image, characters.background_image_files, liked, followed, characters.created_at, characters.updated_at'
    : 'id, owner_id, attributes, avatar_url, status, social, ncover, default_order, greeting_image, background_image_files, liked, followed, created_at, updated_at';
  const query =
    sort === 'popular'
      ? `WITH base AS (
    SELECT characters.id, characters.owner_id, characters.attributes, characters.avatar_url, characters.status, characters.social, characters.ncover, characters.default_order, characters.greeting_image, characters.background_image_files, likes.liked, follows.followed, characters.created_at, characters.updated_at
    ${baseFrom}
  ),
  ranked AS (
    SELECT base.*,
      ROW_NUMBER() OVER (PARTITION BY CASE WHEN owner_id = '${SPECIAL_OWNER_ID}' AND (attributes->>'gender') IS DISTINCT FROM 'Male' THEN 1 END ORDER BY md5(id::text)) AS female_rank,
      ROW_NUMBER() OVER (PARTITION BY CASE WHEN owner_id = '${SPECIAL_OWNER_ID}' AND (attributes->>'gender') = 'Male' THEN 1 END ORDER BY md5(id::text)) AS male_rank
    FROM base
  )
  SELECT
    COUNT(*) OVER() AS "count",
    ${cols}
  FROM ranked
  ORDER BY ${orderClauses.join(', ')}
  LIMIT $2 OFFSET $1`
      : `SELECT
      COUNT(*) OVER() AS "count",
      ${cols}
    ${baseFrom}
    ORDER BY ${orderClauses.join(', ')}
    LIMIT $2 OFFSET $1`;

  const { rows } = await client.query(query, data);

  return rows.reduce((acc, { count, ...res }, index) => {
    if (index === 0) {
      acc.count = parseInt(count, 10);
    }
    acc.data.push(formatCharacterRow(res));
    return acc;
  }, { count: 0, data: [] as CHARACTER[] });
}

// 根据ID列表获取角色
export async function list_by_ids(
  client: Client, schema: string,
  ids: string[]
): Promise<CHARACTER[]> {
  if (ids.length === 0) {
    return [];
  }

  const { rows } = await client.query(
    `SELECT
      id, owner_id, attributes, avatar_url, status, social, ncover,
      greeting_image, background_image_files,
      created_at, updated_at
     FROM "${schema}".characters
     JOIN (SELECT UNNEST($1::UUID[]) AS id) AS ids USING (id)
     ORDER BY created_at DESC`,
    [ids]
  );

  return rows.map(formatCharacterRow);
}

// 删除角色
export async function deleteCharacter(
  client: Client, schema: string,
  cid: string, uid: string
): Promise<void> {
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters
    SET
      status = 'deleted',
      updated_at = NOW()
    WHERE id = $1 AND owner_id = $2
    RETURNING id, status`,
    [cid, uid]
  );

  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
}

// 更新角色状态（用于运营审核）
export async function updateStatus(
  client: Client, schema: string,
  cid: string, status: 'public' | 'rejected' | 'private'
): Promise<void> {
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters
    SET
      status = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, status`,
    [cid, status]
  );

  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
}

// 更新角色推荐状态
export async function updateRecommended(
  client: Client, schema: string,
  cid: string, recommended: boolean
): Promise<void> {
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters
    SET
      recommended = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, recommended`,
    [cid, recommended]
  );

  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
}

export async function updateNcover(
  client: Client, schema: string,
  cid: string, ncover: number | null
): Promise<void> {
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters
    SET
      ncover = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, ncover`,
    [cid, ncover]
  );

  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
}

export async function updateIsOfficial(
  client: Client, schema: string,
  cid: string, is_official: boolean
): Promise<void> {
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters
    SET
      is_official = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, is_official`,
    [cid, is_official]
  );

  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
}

// 在用户账户销毁后删除其所有角色
export async function deleteByOwnerId(
  client: Client, schema: string,
  uid: string
): Promise<void> {
  await client.query(
    `UPDATE "${schema}".characters
    SET
      status = 'deleted',
      updated_at = NOW()
    WHERE owner_id = $1 AND status != 'deleted'`,
    [uid]
  );
}

// 添加帖子图片
export async function addPostImage(
  client: Client, schema: string,
  cid: string, uid: string,
  image_id: string, image_url: string
): Promise<POST_IMAGE> {
  const { rows: [res = null] } = await client.query(
    `INSERT INTO "${schema}".characters_images
    (cid, uid, id, url, source, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id, cid, uid, id, url source`,
    [cid, uid, image_id, image_url, CHARACTER_IMAGES_SOURCES.POST_USER_UPLOAD]
  );

  return res;
}

// 点赞角色
export async function like(
  client: Client, schema: string,
  cid: string, uid: string
) {
  await client.query(
    `WITH insert_likes AS (
      INSERT INTO "${schema}".characters_likes
      (cid, uid)
      VALUES ($1, $2)
      ON CONFLICT (cid, uid) DO NOTHING
      RETURNING cid
    )
    UPDATE "${schema}".characters
    SET
      social = JSONB_SET(
        social, '{likes_count}'::TEXT[],
        TO_JSONB(COALESCE((social ->> 'likes_count')::BIGINT, 0) + 1)
      )
    FROM insert_likes
    WHERE id = insert_likes.cid`,
    [cid, uid]
  );
}

// 取消点赞角色
export async function unlike(
  client: Client, schema: string,
  cid: string, uid: string
) {
  await client.query(
    `WITH delete_likes AS (
      DELETE FROM "${schema}".characters_likes
      WHERE cid = $1 AND uid = $2
      RETURNING cid
    )
    UPDATE "${schema}".characters
    SET
      social = JSONB_SET(
        social, '{likes_count}'::TEXT[],
        TO_JSONB(GREATEST(COALESCE((social ->> 'likes_count')::BIGINT, 1) - 1, 0))
      )
    FROM delete_likes
    WHERE id = delete_likes.cid`,
    [cid, uid]
  );
}

// 关注角色
export async function follow(
  client: Client, schema: string,
  cid: string, uid: string
) {
  await client.query(
    `WITH insert_follows AS (
      INSERT INTO "${schema}".characters_follows
      (cid, uid)
      VALUES ($1, $2)
      ON CONFLICT (cid, uid) DO NOTHING
      RETURNING cid
    )
    UPDATE "${schema}".characters
    SET
      social = JSONB_SET(
        social, '{followed_count}'::TEXT[],
        TO_JSONB(COALESCE((social ->> 'followed_count')::BIGINT, 0) + 1)
      )
    FROM insert_follows
    WHERE id = insert_follows.cid`,
    [cid, uid]
  );
}

// 取消关注角色
export async function unfollow(
  client: Client, schema: string,
  cid: string, uid: string
) {
  await client.query(
    `WITH delete_follows AS (
      DELETE FROM "${schema}".characters_follows
      WHERE cid = $1 AND uid = $2
      RETURNING cid
    )
    UPDATE "${schema}".characters
    SET
      social = JSONB_SET(
        social, '{followed_count}'::TEXT[],
        TO_JSONB(GREATEST(COALESCE((social ->> 'followed_count')::BIGINT, 1) - 1, 0))
      )
    FROM delete_follows
    WHERE id = delete_follows.cid`,
    [cid, uid]
  );
}

// 更新 post 计数
export async function updatePostedCount(
  client: Client, schema: string,
  cid: string, delta: number
): Promise<void> {
  await client.query(`
    UPDATE "${schema}".characters
    SET
      social = JSONB_SET(
        social, '{posted_count}'::TEXT[],
        TO_JSONB(GREATEST(COALESCE((social ->> 'posted_count')::BIGINT, 0) + $2, 0))
      )
    WHERE id = $1
  `, [cid, delta]);
}

// 更新 对话 记数
export async function updateDialogueCount(
  client: Client, schema: string,
  cid: string, delta: number
): Promise<void> {
  await client.query(`
    UPDATE "${schema}".characters
    SET
      social = JSONB_SET(
        social, '{dialogues_count}'::TEXT[],
        TO_JSONB(GREATEST(COALESCE((social ->> 'dialogues_count')::BIGINT, 0) + $2, 0))
      )
    WHERE id = $1
  `, [cid, delta]);
}

// 更新角色默认排序值
export async function updateDefaultOrder(
  client: Client, schema: string,
  cid: string, default_order: number | null
): Promise<void> {
  const value = default_order === 0 ? null : default_order;
  const { rows: [res] } = await client.query(
    `UPDATE "${schema}".characters
    SET default_order = $2
    WHERE id = $1
    RETURNING id`,
    [cid, value]
  );

  if (!res) {
    throw new CHARACTER_MODEL_ERROR('CHARACTER_NOT_FOUND');
  }
}
