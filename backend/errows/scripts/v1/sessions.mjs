import path from 'node:path';
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { dbClientWrapper } from '../utils.mjs';
import { lookupOldUsers } from './users.mjs';
import { formatDate } from './utils.mjs';
import { lookupCharacters } from './characters.mjs';

const __dirname = new URL(path.dirname(import.meta.url)).pathname;
export const command = 'sessions <data_dir>';
export const describe = 'migrate sessions from v1';
export { builder } from './utils.mjs';


export const handler = dbClientWrapper(migrate);
export async function migrate(client, argv) {
  const deleteSessionIdSet = new Set();
  await migrateSessions(client, argv, deleteSessionIdSet);
  await migrateSessionMessages(client, argv, deleteSessionIdSet);
}

export async function migrateSessions(client, argv, deleteSessionIdSet) {
  const { verbose } = argv;
  await initV1Map(client);
  const { default: config } = await import('config');
  const schema = config.scope;

  const ar_sessions_path = path.resolve(
    process.cwd(),
    argv.data_dir, 'ar_conversation_record.csv'
  );
  verbose && console.log('Reading v1 session from', ar_sessions_path);
  const sessionParser = parse({ columns: true, delimiter: ',' });
  fs.createReadStream(ar_sessions_path, 'utf-8').pipe(sessionParser);


  const sessions = [];
  const userIdsSet = new Set();
  const characterIdsSet = new Set();
  for await (const row of sessionParser) {
    const session = convertSession(row);
    const {
      old_session_id,
      old_user_id, old_character_id, is_deleted
    } = session;
    if (is_deleted) {
      deleteSessionIdSet.add(session.old_session_id);
      verbose && console.info(`Session id ${session.old_session_id} is deleted, skip.`);
      continue;
    }

    if (!old_session_id) {
      verbose && console.error(`Session with empty id, skip.`);
      continue;
    }
    userIdsSet.add(old_user_id);
    characterIdsSet.add(old_character_id);
    sessions.push(session);
  }
  console.log(`Loaded ${sessions.length} sessions from v1 database.`);

  const userIdMap = await lookupOldUsers(client, schema, Array.from(userIdsSet));
  const charactersMap = await lookupCharacters(client, schema, Array.from(characterIdsSet));

  for (const session of sessions) {
    const {
      old_session_id,
      old_character_id,
      old_user_id,
      conversation_name,
      model,
      memory,
      created_at, updated_at,
    } = session;

    const user = userIdMap.get(old_user_id);
    if (!user) {
      verbose && console.error(`Session id ${old_session_id} user id ${old_user_id} not found`);
      continue;
    }
    const { id: uid, name: user_name } = user;
    const persona_name = trimString2Null(conversation_name) ?? user_name;

    const { rows: [{ id: persona_id }] } = await client.query(
      `WITH inserted AS (
        INSERT INTO v1.session_personas (old_id)
        VALUES ($1)
        ON CONFLICT DO NOTHING
        RETURNING id
      ),
      persona_id AS (
        SELECT id FROM inserted
        UNION
        SELECT id FROM v1.session_personas
        WHERE old_id = $1
      )
      INSERT INTO ${schema}.session_personas
      (id, uid, name, created_at, updated_at)
      SELECT persona_id.id, $2, $3, $4, $5
      FROM persona_id
      ON CONFLICT (uid, id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = EXCLUDED.updated_at
      RETURNING id`,
      [
        old_session_id, uid,
        persona_name, created_at, updated_at
      ]
    );

    const character = charactersMap.get(old_character_id);
    if (!character) {
      verbose && console.error(`Session id ${old_session_id} character id ${old_character_id} not found`);
      continue;
    }

    const cid = character.id;

    const settings = { model, memory };

    // 先用 old_session_id 在 v1.sessions 表中 insert 获取 id
    // 再用该 id 在 ${schema}.sessions 表中 insert 或 update 记录
    await client.query(
      `WITH binding AS (
        INSERT INTO v1.sessions (old_id)
        VALUES ($1)
        ON CONFLICT DO NOTHING
        RETURNING id
      ),
      session_id AS (
        SELECT id FROM binding
        UNION
        SELECT id FROM v1.sessions WHERE old_id = $1
      )
      INSERT INTO ${schema}.sessions
      (id, uid, cid, pid, settings, created_at, updated_at)
      SELECT id, $2, $3, $4, $5, $6, $7
      FROM session_id
      ON CONFLICT (id) DO UPDATE SET
        cid = EXCLUDED.cid,
        pid = EXCLUDED.pid,
        settings = EXCLUDED.settings || sessions.settings,
        updated_at = EXCLUDED.updated_at`,
      [
        old_session_id, uid, cid, persona_id,
        settings, created_at, updated_at
      ]
    );

    verbose && console.log(`Session id ${old_session_id} migrated.`);
  }
}

/*
CREATE TABLE `ar_conversation_record` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `character_id` int NOT NULL COMMENT '角色ID',
  `conversation_nickname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '角色称呼',
  `user_id` int NOT NULL COMMENT '用户ID',
  `user_nickname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '用户昵称',
  `model` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '模型',
  `memory` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '记忆长度',
  `last_chat_record_id` int DEFAULT NULL COMMENT '最后聊天记录ID',
  `last_chat_record` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '最后一条聊天记录',
  `createtime` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatetime` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deletetime` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_conversation_record_character_id` (`character_id`),
  KEY `idx_conversation_record_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=56034 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
*/

function convertSession(row) {
  const {
    id: old_session_id,
    character_id: old_character_id,
    user_id: old_user_id,
    conversation_nickname,
    user_nickname,
    memory,
    last_chat_record_id,
    last_chat_record,
    createtime, updatetime,
  } = row;
  const is_deleted = trimString2Null(row.deletetime) === null;

  const model = convertModel(trimString2Null(row.model));

  const conversation_name = trimString2Null(conversation_nickname)
    ?? trimString2Null(user_nickname)
    ?? '';

  return {
    old_session_id,
    old_character_id,
    old_user_id,
    conversation_name,
    model,
    memory: trimString2Null(memory) ?? 'default',
    last_chat_record_id: trimString2Null(last_chat_record_id),
    last_chat_record: trimString2Null(last_chat_record),
    created_at: formatDate(createtime),
    updated_at: formatDate(updatetime),
    is_deleted,
  };
}

function convertModel(modelName) {
  const basic = 'butter v1.0';
  if (!modelName) return basic;
  const mapping = {
    'basic': basic,
    'premium': 'RPMaster',
  };

  return mapping[modelName] ?? basic;
}

async function migrateSessionMessages(client, argv, deleteSessionIdSet) {
  const { verbose } = argv;
  await initV1Map(client);
  const { default: config } = await import('config');
  const schema = config.scope;


  verbose && console.log('Reading v1 session messages from', ar_session_messages_path);
  const ar_session_messages_path = path.resolve(
    process.cwd(),
    argv.data_dir, 'ar_chat_record.csv'
  );
  const messageParser = parse({ columns: true, delimiter: ',' });
  fs.createReadStream(ar_session_messages_path, 'utf-8').pipe(messageParser);

  let ignoreMessageByDeletedSessionCount = 0;

  const session_messages = [];
  const sessionIdSet = new Set();
  for await (const row of messageParser) {
    const message = convertSessionMessage(row);

    const { old_message_id, old_session_id, is_deleted } = message;

    if (deleteSessionIdSet.has(old_session_id)) {
      ignoreMessageByDeletedSessionCount++;
      continue;
    }

    if (is_deleted) {
      verbose && console.info(`Session id ${old_message_id} is deleted, skip.`);
      continue;
    }
    if (!old_message_id) {
      verbose && console.error(`Session message with empty id, skip.`);
      continue;
    }
    sessionIdSet.add(message.old_session_id);
    session_messages.push(message);
  }

  console.log(`Loaded ${session_messages.length} session messages from v1 database.`);
  if (ignoreMessageByDeletedSessionCount > 0) {
    console.log(
      `Ignored ${ignoreMessageByDeletedSessionCount} messages ` +
      `belonging to deleted sessions.`
    );
  }

  const sessionMap = await lookupSessions(client, Array.from(sessionIdSet));

  for (const message of session_messages) {
    const {
      old_message_id,
      old_session_id,
      role,
      type,
      content,
      voice_url,
      image_url,
      feedback,
      created_at, updated_at,
    } = message;

    const session = sessionMap.get(old_session_id);
    if (!session) {
      verbose && console.error(
        `Session message id ${old_message_id} session id ${old_session_id} not found`
      );
      continue;
    }
    const sid = session.id;

    // 先在 v1 中 binding
    await client.query(
      `WITH binding AS (
          INSERT INTO v1.session_messages (old_id)
          VALUES ($1)
          ON CONFLICT DO NOTHING
          RETURNING id
        ),
        message_id AS (
          SELECT id FROM binding
          UNION
          SELECT id FROM v1.session_messages WHERE old_id = $1
        )

        INSERT INTO ${schema}.session_messages (
          id, sid, role,
         type, content, voice_url, image_url, feedback,
         sended_at, edited_at
        )
        SELECT id, $2, $3,
         $4, $5, $6, $7, $8,
         $9, $10
        FROM message_id
        ON CONFLICT (sid, id) DO UPDATE SET
          type = EXCLUDED.type,
          content = EXCLUDED.content,
          voice_url = EXCLUDED.voice_url,
          image_url = EXCLUDED.image_url,
          feedback = EXCLUDED.feedback,
          edited_at = EXCLUDED.edited_at`,
      [
        old_message_id, sid, role,
        type, content, voice_url, image_url, feedback,
        created_at, updated_at
      ]
    );

    verbose && console.log(`Session message id ${old_message_id} migrated.`);
  }
}

/*
 * CREATE TABLE `ar_chat_record` (
 *   `id` int NOT NULL AUTO_INCREMENT COMMENT '主键ID',
 *   `conversation_id` int NOT NULL COMMENT '会话ID',
 *   `character_id` int NOT NULL COMMENT '角色ID',
 *   `sender_type` smallint NOT NULL DEFAULT '1' COMMENT '发送者类型 2 用户 1角色',
 *   `sender_user_id` int NOT NULL COMMENT '发起用户ID',
 *   `is_first` int DEFAULT '0' COMMENT '是否第一条消息',
 *   `is_lock` int DEFAULT '0' COMMENT '是否锁定，用户不可查看',
 *   `type` int DEFAULT '1' COMMENT '类型：1=文本；2=图片',
 *   `reply` int DEFAULT '0' COMMENT '是否已经回复',
 *   `message_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '消息内容（md格式）',
 *   `voice` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '语音文件',
 *   `upvote_or_downvote` int DEFAULT NULL COMMENT '赞1或踩2',
 *   `createtime` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
 *   `updatetime` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
 *   `deletetime` datetime DEFAULT NULL COMMENT '删除时间',
 * );
 */
function convertSessionMessage(row) {
  const {
    id: old_message_id,
    conversation_id: old_session_id,
    sender_user_id: old_user_id,
    character_id: old_character_id,
    voice,
    createtime, updatetime, deletetime
  } = row;
  const old_content = trimString2Null(row.message_content);
  const old_type = trimString2Null(row.type);
  const upvote_or_downvote = trimString2Null(row.upvote_or_downvote);
  const sender_type = trimString2Null(row.sender_type);

  const is_deleted = deletetime?.trim() !== '';
  const voice_url = trimString2Null(voice);

  const type = old_type === '2' ? 'image' : 'text';
  const image_url = type === 'image' ? old_content : null;
  const content = type === 'text' ? (old_content ?? "") : "";

  const feedback = upvote_or_downvote === '1'
    ? 'like'
    : (upvote_or_downvote === '2' ? 'dislike' : null);

  const role = sender_type === '1' ? 'character' : 'user';


  return {
    old_message_id,
    old_session_id,
    old_user_id,
    old_character_id,
    role,
    type,
    content,
    voice_url,
    image_url,
    feedback,
    created_at: formatDate(createtime),
    updated_at: formatDate(updatetime),
    is_deleted,
  };
}

async function initV1Map(client) {
  const bootstrapSQL = await fs.promises.readFile(
    path.join(__dirname, '../..', 'db/v1', 'sessions.sql'),
    'utf-8'
  );

  await client.query(bootstrapSQL);
}

function trimString2Null(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

async function lookupSessions(client, old_ids) {
  const { rows } = await client.query(
    `SELECT old_id, id FROM v1.sessions
    JOIN (SELECT UNNEST($1::bigint[]) AS old_id) AS old_ids USING (old_id)`,
    [old_ids]
  );

  const map = new Map();
  for (const row of rows) {
    map.set(row.old_id, { id: row.id });
  }
  return map;
}