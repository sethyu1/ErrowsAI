import { Client } from "pg";
import { ModelError } from "./utils.js";
import {
  SESSION_CHAT_HISTORY, SESSION_MESSAGE, SESSION_PERSONA,
  SESSION_PERSONA_BODY, SESSION_SETTING, SESSION_SUMMARY
} from "@errows/types";

export class SESSION_MODEL_ERROR extends ModelError<
  | 'SESSION_PERSONA_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_MESSAGE_NOT_FOUND'
  | 'FORBIDDEN_TO_UPDATE_NOT_LAST_USER_MESSAGE'
> { };

// 创建会话角色
export async function createSessionPersona(
  client: Client, schema: string,
  uid: string,
  body: SESSION_PERSONA_BODY
): Promise<{ id: string }> {
  const { name, description } = body;

  const { rows: [res] } = await client.query<{ id: string }>(
    `INSERT INTO "${schema}".session_personas (uid, name, description)
    VALUES ($1, $2, $3)
    RETURNING id`,
    [uid, name, description]
  );

  return res as { id: string };
}

// 获取会话角色列表
export async function listSessionPersonas(
  client: Client, schema: string,
  uid: string
): Promise<SESSION_PERSONA[]> {
  const { rows } = await client.query<SESSION_PERSONA>(
    `SELECT id, name, description
    FROM "${schema}".session_personas
    WHERE uid = $1 AND deleted_at IS NULL
    ORDER BY created_at DESC`,
    [uid]
  );

  return rows;
}

// 更新会话角色
export async function updateSessionPersona(
  client: Client, schema: string,
  uid: string, pid: string,
  body: SESSION_PERSONA_BODY
): Promise<void> {
  const { name, description } = body;

  const { rowCount } = await client.query(
    `UPDATE "${schema}".session_personas
    SET name = COALESCE($1, name), description = COALESCE($2, description),
        updated_at = NOW()
    WHERE id = $3 AND uid = $4 AND deleted_at IS NULL`,
    [name, description, pid, uid]
  );

  if (rowCount === 0) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_PERSONA_NOT_FOUND', 'Session persona not found'
    );
  }
}

// 创建会话
export async function createSession(
  client: Client, schema: string,
  uid: string, pid: string,
  cid: string,
  settings: SESSION_SETTING
): Promise<{ id: string, is_new: boolean; }> {

  const { rows: [res] } = await client.query<{ id: string, is_new: boolean }>(
    `WITH existing AS (
      SELECT id, FALSE AS is_new FROM "${schema}".sessions
      WHERE uid = $1 AND pid = $2 AND cid = $3 AND deleted_at IS NULL
    ),
    undeleted AS (
      UPDATE "${schema}".sessions
      SET deleted_at = NULL, settings = $4, updated_at = NOW()
      WHERE uid = $1 AND pid = $2 AND cid = $3 AND deleted_at IS NOT NULL
      RETURNING id, TRUE AS is_new
    ),
    create_new AS (
      INSERT INTO "${schema}".sessions (uid, pid, cid, settings)
      SELECT $1, $2, $3, $4
      WHERE NOT EXISTS (SELECT 1 FROM "${schema}".sessions WHERE uid = $1 AND pid = $2 AND cid = $3)
      RETURNING id, TRUE AS is_new
    )
    SELECT * FROM existing
    UNION ALL
    SELECT * FROM undeleted
    UNION ALL
    SELECT * FROM create_new
    LIMIT 1`,
    [uid, pid, cid, settings]
  );

  if (!res) {
    // This should theoretically not happen if the logic above is sound and constraints are met,
    // but we add a fallback to avoid the "cannot read property id of undefined" error.
    throw new SESSION_MODEL_ERROR('SESSION_NOT_FOUND', 'Failed to create or find session');
  }

  if (res.is_new) {
    // If it's a new session (either created or undeleted), mark old messages as deleted
    // to ensure a fresh start.
    await client.query(
      `UPDATE "${schema}".session_messages
      SET deleted_at = NOW()
      WHERE sid = $1 AND deleted_at IS NULL`,
      [res.id]
    );
  }

  return res;
}

export async function countTextMessageTurns(
  client: Client, schema: string, uid: string
): Promise<{ [model: string]: number, total: number }> {

  const { rows } = await client.query<{ model: String, count: number }>(
    `SELECT
      s.settings ->> 'model' AS model,
      COUNT(*)::int AS count
    FROM "${schema}".session_messages sm
    JOIN "${schema}".sessions s ON sm.sid = s.id
    WHERE s.uid = $1 AND sm.role = 'user' AND sm.type = 'text'
    GROUP BY s.settings ->> 'model'`,
    [uid]
  );

  const result: { [model: string]: number, total: number } = { total: 0 };
  for (const row of rows) {
    result[row.model as string] = row.count;
    result.total += row.count;
  }

  return result;
}

// 获取会话详情
export async function getSession(
  client: Client, schema: string,
  sid: string, uid: string
): Promise<SESSION_CHAT_HISTORY> {

  const { rows: [session] } = await client.query<SESSION_CHAT_HISTORY>(
    `SELECT
      s.id, s.cid,
      s.settings,
      JSON_BUILD_OBJECT(
        'id', sp.id,
        'name', sp.name,
        'description', sp.description
      ) AS persona,
      COALESCE(
        (
          SELECT json_agg(
            JSON_BUILD_OBJECT(
              'id', sm.id,
              'role', sm.role,
              'type', sm.type,
              'reply_to_id', sm.reply_to_id,
              'content', sm.content,
              'voice_url', sm.voice_url,
              'image_url', sm.image_url,
              'sended_at', sm.sended_at,
              'edited_at', sm.edited_at,
              'feedback', sm.feedback,
              'info', sm.info
            ) ORDER BY sm.sended_at
          )
          FROM "${schema}".session_messages sm
          WHERE sm.sid = s.id AND sm.deleted_at IS NULL
        ),
        '[]'::json
      ) AS messages,
      s.created_at,
      s.updated_at
    FROM "${schema}".sessions s
    JOIN "${schema}".session_personas sp ON s.pid = sp.id AND s.uid = sp.uid
    WHERE s.id = $1 AND s.uid = $2 AND sp.deleted_at IS NULL`,
    [sid, uid]
  );

  if (!session) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND', 'Session not found'
    );
  }

  return session;
}

// 删除会话角色
export async function deleteSessionPersona(
  client: Client, schema: string,
  uid: string, pid: string
) {
  const { rowCount } = await client.query(
    `UPDATE "${schema}".session_personas
    SET deleted_at = NOW()
    WHERE id = $1 AND uid = $2 AND deleted_at IS NULL`,
    [pid, uid]
  );

  if (rowCount === 0) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_PERSONA_NOT_FOUND', 'Session persona not found'
    );
  }
}

// 附加消息
async function appendMessage(
  client: Client, schema: string,
  sid: string,
  message_id: string | null = null,
  reply_to_id: string | null = null,
  role: 'user' | 'character',
  type: 'text' | 'image' | 'voice_call' | 'gift' = 'text',
  message: {
    content: string,
    voice_url?: string;
    image_url?: string;
    info?: Record<string, any>;
  },
): Promise<{ id: string }> {
  const { content = '', voice_url = null, image_url = null, info = null } = message;

  const { rows: [res] } = await client.query<{ id: string }>(
    `INSERT INTO "${schema}".session_messages
    (
      sid, id, role, type, content,
      reply_to_id,
      voice_url, image_url, info
    )
    VALUES ($1, COALESCE($2, gen_random_uuid()), $3, $4, $5, $6, $7, $8, $9)
    RETURNING id`,
    [
      sid, message_id, role, type, content,
      reply_to_id,
      voice_url, image_url, info
    ]
  );

  return res as { id: string };
}

// 附加用户消息
export async function appendUserMessage(
  client: Client, schema: string,
  sid: string,
  content: string,
  media: {
    voice_url?: string;
    image_url?: string;
    info?: Record<string, any>;
  } = {},
  message_id: string | null = null,
  reply_to_id: string | null = null,
  type: 'text' | 'image' | 'voice_call' | 'gift' = 'text',
): Promise<{ id: string }> {
  return appendMessage(
    client, schema,
    sid, message_id, reply_to_id,
    'user', type,
    { content, ...media }
  );
}

// 附加角色消息
export async function appendCharacterMessage(
  client: Client, schema: string,
  sid: string,
  content: string,
  media: {
    voice_url?: string;
    image_url?: string;
    info?: Record<string, any>;
  } = {},
  message_id: string | null = null,
  reply_to_id: string | null = null,
  type: 'text' | 'image' | 'voice_call' | 'gift' = 'text',
): Promise<{ id: string }> {
  return appendMessage(
    client, schema,
    sid, message_id, reply_to_id,
    'character', type,
    { content, ...media }
  );
}

// 更新消息及其回复
export async function updateMessageWithReply(
  client: Client, schema: string, uid: string, sid: string,
  mid: string, content: string,
  reply_message_id: string | null, reply_content: string
): Promise<void> {

  const { rowCount } = await client.query(
    `UPDATE "${schema}".session_messages sm
    SET content = data.content, edited_at = NOW(), feedback = NULL
    FROM (
      SELECT id AS sid, mid, content FROM (
        VALUES
          ($1::UUID, $2::UUID, $3::UUID, $4),
          ($1::UUID, $2::UUID, $5::UUID, $6)
      ) AS data(id, uid, mid, content)
      JOIN "${schema}".sessions USING(id, uid)
      WHERE deleted_at IS NULL
    ) AS data
    WHERE sm.sid = data.sid AND sm.id = data.mid AND sm.deleted_at IS NULL`,
    [sid, uid, mid, content, reply_message_id, reply_content]
  );

  if (rowCount === 0) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND', 'Message not found'
    );
  }
}

// 获取会话列表
export async function listSessions(
  client: Client, schema: string,
  uid: string
): Promise<SESSION_SUMMARY[]> {
  const { rows } = await client.query<SESSION_SUMMARY>(
    `SELECT
      s.id, s.cid,
      s.settings,
      JSON_BUILD_OBJECT(
        'id', sp.id,
        'name', sp.name,
        'description', sp.description
      ) AS persona,
      ms.last_message_preview,
      ms.last_message_at,
      ms.messages_count,
      s.created_at,
      s.updated_at
    FROM "${schema}".sessions s
    JOIN "${schema}".session_personas sp ON s.pid = sp.id AND s.uid = sp.uid
    LEFT JOIN LATERAL (
      SELECT
        FIRST_VALUE(content) OVER (ORDER BY sended_at DESC) AS last_message_preview,
        FIRST_VALUE(sended_at) OVER (ORDER BY sended_at DESC) AS last_message_at,
        COUNT(*) OVER ()::int AS messages_count
      FROM "${schema}".session_messages
      WHERE sid = s.id AND deleted_at IS NULL
      LIMIT 1
    ) ms ON true
    WHERE s.uid = $1 AND s.deleted_at IS NULL AND sp.deleted_at IS NULL
    ORDER BY s.updated_at DESC`,
    [uid]
  );

  return rows;
}

// 更新会话设置
export async function updateSession(
  client: Client, schema: string,
  sid: string, uid: string,
  settings: Partial<SESSION_SETTING>
): Promise<void> {
  const { rowCount } = await client.query(
    `UPDATE "${schema}".sessions
    SET settings = settings || $1::jsonb
    WHERE id = $2 AND uid = $3 AND deleted_at IS NULL`,
    [JSON.stringify(settings), sid, uid]
  );

  if (rowCount === 0) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND', 'Session not found'
    );
  }
}

// 更新消息语音URL
export async function updateMessageVoiceUrl(
  client: Client, schema: string,
  sid: string, mid: string, uid: string,
  voice_url: string
): Promise<{ voice_url: string }> {
  await client.query(
    `UPDATE "${schema}".session_messages sm
    SET voice_url = $1
    FROM "${schema}".sessions s
    WHERE sm.id = $2 AND sm.sid = $3 AND s.id = $3
      AND s.uid = $4 AND sm.deleted_at IS NULL AND s.deleted_at IS NULL`,
    [voice_url, mid, sid, uid]
  );

  return { voice_url };
}

// 更新消息图片URL
export async function updatePictureUrlInSessionMessage(
  client: Client, schema: string,
  sid: string, send_message_id: string,
  image_url: string
): Promise<{ image_url: string }> {
  const { rowCount } = await client.query(
    `UPDATE "${schema}".session_messages sm
    SET image_url = $1
    FROM "${schema}".sessions s
    WHERE sm.id = $2 AND sm.sid = $3 AND s.id = $3
      AND sm.deleted_at IS NULL AND s.deleted_at IS NULL`,
    [image_url, send_message_id, sid]
  );

  if (rowCount === 0) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_MESSAGE_NOT_FOUND', 'Message not found'
    );
  }

  return { image_url };
}

// 获取单条消息
export async function getMessage(
  client: Client, schema: string,
  sid: string, mid: string, uid: string
): Promise<SESSION_MESSAGE> {
  const { rows } = await client.query<SESSION_MESSAGE>(
    `SELECT
      sm.id, sm.role, s.cid,
      sm.type,
      sm.content, sm.voice_url, sm.image_url,
      sm.sended_at, sm.edited_at,
      sm.feedback, sm.info
    FROM "${schema}".session_messages sm
    JOIN "${schema}".sessions s ON sm.sid = s.id
    WHERE sm.id = $1 AND sm.sid = $2 AND s.uid = $3
      AND sm.deleted_at IS NULL AND s.deleted_at IS NULL`,
    [mid, sid, uid]
  );

  if (rows.length === 0) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND', 'Message not found'
    );
  }

  return rows[0] as SESSION_MESSAGE;
}

// 更新消息反馈
export async function updateMessageFeedback(
  client: Client, schema: string,
  sid: string, mid: string, uid: string,
  feedback: 'like' | 'dislike'
): Promise<void> {
  const { rowCount } = await client.query(
    `UPDATE "${schema}".session_messages sm
    SET feedback = CASE
      WHEN sm.feedback = $1 THEN NULL
      ELSE $1
    END
    FROM "${schema}".sessions s
    WHERE sm.id = $2 AND sm.sid = $3 AND s.id = $3
      AND s.uid = $4 AND sm.deleted_at IS NULL AND s.deleted_at IS NULL`,
    [feedback, mid, sid, uid]
  );

  if (rowCount === 0) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND', 'Message not found'
    );
  }
}

// 删除消息
export async function deleteMessage(
  client: Client, schema: string,
  sid: string, uid: string, mid: string
): Promise<void> {
  const { rowCount } = await client.query(
    `UPDATE "${schema}".session_messages sm
    SET deleted_at = NOW()
    FROM "${schema}".sessions s
    WHERE sm.sid = $1 AND s.id = sm.sid AND s.uid = $2
    AND (sm.id = $3 OR sm.reply_to_id = $3)
    AND sm.deleted_at IS NULL`,
    [sid, uid, mid]
  );

  if (rowCount === 0) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_MESSAGE_NOT_FOUND', 'Message not found'
    );
  }
}

// 删除会话
export async function deleteSession(
  client: Client, schema: string,
  sid: string, uid: string
): Promise<void> {
  const { rowCount } = await client.query(
    `UPDATE "${schema}".sessions
    SET deleted_at = NOW()
    WHERE id = $1 AND uid = $2 AND deleted_at IS NULL`,
    [sid, uid]
  );

  if (rowCount === 0) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND', 'Session not found'
    );
  }
}

export async function startVoiceCall(
  client: Client, schema: string,
  sid: string, uid: string,
  id: string
): Promise<{ id: string, start_at: string }> {
  const { rows: [res = null] } = await client.query<
    { id: string, start_at: string }
  >(
    `INSERT INTO "${schema}".session_voice_calls
    (id, sid, status)
    SELECT $1, id as sid, 'started' AS status
    FROM "${schema}".sessions
    WHERE id = $2 AND uid = $3 AND deleted_at IS NULL
    RETURNING id, start_at`,
    [id, sid, uid]
  );

  if (res === null) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND', 'Session not found'
    );
  }

  return res;
}

export async function getVoiceCall(
  client: Client, schema: string,
  sid: string, cid: string
): Promise<{ id: string, status: string }> {
  const { rows: [res = null] } = await client.query<
    { id: string, status: string }
  >(
    `SELECT svc.id, svc.status
    FROM "${schema}".session_voice_calls svc
    JOIN "${schema}".sessions ON svc.sid = sessions.id
    WHERE sid = $1 AND svc.id = $2 AND sessions.deleted_at IS NULL`,
    [sid, cid]
  );

  if (res === null) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND',
      'Voice call not found'
    );
  }

  return res;
}

export async function appendVoiceCallSegment(
  client: Client, schema: string,
  call_id: string, voice_call_segment_id: string,
  transcript_user: string
): Promise<void> {
  const { rows: [res = null] } = await client.query(
    `INSERT INTO "${schema}".session_voice_call_segments
    (voice_call_id, id, transcript_user)
    SELECT id, $2, $3 FROM "${schema}".session_voice_calls svc
    WHERE svc.id = $1
    RETURNING id`,
    [call_id, voice_call_segment_id, transcript_user]
  );

  if (res === null) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND',
      'Voice call not found'
    );
  }
}

export async function updateVoiceCallSegment(
  client: Client, schema: string,
  call_id: string, voice_call_segment_id: string,
  details: { transcript_character?: string[]; summary?: string[] }
): Promise<void> {
  const transcript = details.transcript_character ?? null;
  const summary = details.summary ?? null;

  const { rowCount } = await client.query(
    `UPDATE "${schema}".session_voice_call_segments
    SET transcript_character = COALESCE($3::TEXT[], transcript_character),
        summary = COALESCE($4::TEXT[], summary),
        updated_at = NOW()
    WHERE voice_call_id = $1 AND id = $2`,
    [call_id, voice_call_segment_id, transcript, summary]
  );

  if (rowCount === 0) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND',
      'Voice call segment not found'
    );
  }
}

type VoiceCallSegmentRow = {
  id: string;
  transcript_user: string;
  transcript_character: string[] | null;
  summary: string[] | null;
  created_at: Date;
  updated_at: Date;
};

export async function listVoiceCallSegments(
  client: Client, schema: string,
  call_id: string
): Promise<VoiceCallSegmentRow[]> {
  const { rows } = await client.query<VoiceCallSegmentRow>(
    `SELECT id, transcript_user, transcript_character, summary,
            created_at, updated_at
     FROM "${schema}".session_voice_call_segments
     WHERE voice_call_id = $1
     ORDER BY created_at`,
    [call_id]
  );

  return rows;
}

export async function replaceVoiceCallSegments(
  client: Client, schema: string,
  call_id: string,
  segments: { transcript_user: string; transcript_character?: string[] }[]
): Promise<void> {
  await client.query(
    `DELETE FROM "${schema}".session_voice_call_segments WHERE voice_call_id = $1`,
    [call_id]
  );
  for (const s of segments) {
    await client.query(
      `INSERT INTO "${schema}".session_voice_call_segments
       (id, voice_call_id, transcript_user, transcript_character)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [call_id, s.transcript_user, s.transcript_character ?? null]
    );
  }
}

type VoiceCallRow = {
  id: string;
  sid: string;
  status: string;
  summary: string | null;
  start_at: Date;
  ended_at: Date | null;
};

export async function finishVoiceCall(
  client: Client, schema: string,
  sid: string, call_id: string,
  summary: string | null
): Promise<VoiceCallRow> {
  const { rows: [res = null] } = await client.query<VoiceCallRow>(
    `UPDATE "${schema}".session_voice_calls
     SET status = 'ended',
         summary = $3,
         ended_at = COALESCE(ended_at, NOW())
     WHERE id = $1 AND sid = $2
     RETURNING id, sid, status, summary, start_at, ended_at`,
    [call_id, sid, summary]
  );

  if (res === null) {
    throw new SESSION_MODEL_ERROR(
      'SESSION_NOT_FOUND',
      'Voice call not found'
    );
  }

  return res;
}
