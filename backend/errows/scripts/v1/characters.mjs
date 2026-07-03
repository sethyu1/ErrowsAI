import path from 'node:path';
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { dbClientWrapper } from '../utils.mjs';
import { ensureOfficeUser, lookupOldUsers } from './users.mjs';
import { buildModelParams } from '@errows/ai';
import { formatDate } from './utils.mjs';
import { Character } from '@errows/models';

const __dirname = new URL(path.dirname(import.meta.url)).pathname;
export const command = 'characters <data_dir>';
export const describe = 'migrate characters from v1';
export { builder } from './utils.mjs';

/**
 * @description ar_characters.csv columns:
 * id,uuid,user_id,is_official,status,
 * age,background_image_files,nickname,
 * charactergender,is_new,avatar,sex,
 * description,greeting,greeting_img,
 * cid,category,ext,follow,collect,
 * like,model_description,wiBefore,
 * system,body,personality,
 * scenario,wiAfter,persona,tag,
 * genre,dialogue,trim,weight,
 * tag_list,voice,video,
 * un_office_value,creator,
 * prompt1,prompt2,last_time,
 * createtime,updatetime,deletetime,is_preview
 *
 * */


export const handler = dbClientWrapper(migrateCharacters);
export async function migrateCharacters(client, argv) {
  const { verbose } = argv;
  await initV1Map(client);
  const { default: config } = await import('config');
  const schema = config.scope;

  const parser = parse({ columns: true, delimiter: ',' });
  const ar_characters_path = path.resolve(
    process.cwd(),
    argv.data_dir, 'ar_character.csv'
  );

  verbose && console.log('Reading v1 characters from', ar_characters_path);
  fs.createReadStream(ar_characters_path, 'utf-8').pipe(parser);

  const character_creation_options = await fs.promises.readFile(
    path.join(__dirname, '../..', 'static', 'character_creation.json'),
    'utf-8'
  ).then(data => JSON.parse(data));

  const characters = [];
  const userIdsSet = new Set();
  for await (const row of parser) {
    const character = convertCharacter(row, character_creation_options);
    const { old_id, is_deleted, status } = character;
    if (is_deleted) {
      verbose && console.info(`Character id ${old_id} is deleted, skip.`);
      continue;
    }

    if (['public', 'private'].includes(status) === false) {
      verbose && console.info(`Character id ${old_id} status is ${status}, skip.`);
      continue;
    }

    if (character.old_uid !== "") {
      userIdsSet.add(character.old_uid);
    }
    characters.push(character);
  }

  const usersMap = await lookupOldUsers(client, schema, Array.from(userIdsSet));
  const officeUid = await ensureOfficeUser(client, schema);
  for (const character of characters) {
    const {
      old_id, old_uid,
      status, avatar_url,
      is_official, created_at, updated_at,
      social,
    } = character;

    const flatSetting = {
      ...character.identity,
      ...character.style,
      ...character.dialogue,
      ...character.model_params,
    };
    const { attributes } = Character.convertToDBSetting(flatSetting);

    if (old_uid === '' && is_official === false) {
      console.error(`Character id ${old_id} has no creator info`);
      continue;
    }
    const owner_id = is_official ? officeUid : usersMap.get(old_uid)?.id;
    if (!owner_id) {
      console.error(`Character id ${old_id} creator uid ${old_uid} not found`);
      continue;
    }

    await client.query(
      `WITH bind_id AS (
        INSERT INTO v1.characters (id, old_id)
        VALUES (GEN_RANDOM_UUID(), $1)
        ON CONFLICT (old_id) DO NOTHING
        RETURNING id
      ),
      character_id AS (
        SELECT id FROM bind_id
        UNION
        SELECT id FROM v1.characters WHERE old_id = $1
      ),
      avatar_asset AS (
        INSERT INTO ${schema}.characters_images
          (id, cid, uid, source, url, created_at)
        SELECT
          id, id, $2, 'avatar_generation', $4::TEXT, $10
        FROM character_id
        WHERE $4 IS NOT NULL
        ON CONFLICT (id) DO UPDATE
        SET url = EXCLUDED.url
      )
      INSERT INTO ${schema}.characters
        (id, owner_id, status, avatar_url,
        attributes, social,
        created_at, updated_at)
      SELECT
        id, $2, $3, $4,
        $5, $8,
        $6, $7
      FROM character_id
      ON CONFLICT (id) DO UPDATE SET
        owner_id = EXCLUDED.owner_id,
        status = EXCLUDED.status,
        avatar_url = EXCLUDED.avatar_url,
        attributes = EXCLUDED.attributes,
        social = EXCLUDED.social
      RETURNING id`,
      [
        old_id, owner_id, status, avatar_url,
        JSON.stringify(attributes), created_at, updated_at, social
      ]
    );
  }
}

function convertCharacter(row, character_creation_options) {
  const {
    id,
    status, category,
    background_image_files, avatar,
    age, nickname, description,
    model_description,
    // sex 比 charactergender 不规范但是有用
    charactergender, sex,
    greeting, greeting_img,
    personality, scenario,
    genre, dialogue,
    // 目前用的 tag
    tag, tag_list,
    voice, video,
    un_office_value,
    follow, collect, like,
    createtime, updatetime, deletetime, last_time,
    // 用 user_id 解决 creator
    is_official, user_id, creator,
    // 还不知道做什么的
    prompt1, prompt2,
    // 目前未使用字段
    is_preview, is_new,
    cid,
    // 数据都为空不处理
    persona,
    // 未知字段
    trim, ext, wiBefore, system, wiAfter,
    weight,
  } = row;

  const type = category === 'Anime' ? 'anime' : 'realistic';
  const gender = sex.toLowerCase() === 'male' ? 'Male' : 'Female';
  const identity = {
    nickname,
    introduction: description,
    gender,
    type, age,
  };

  const style = {};
  try {
    const tags = tryParseJSONArray(tag);
    Object.assign(style, { tags });
  } catch (_error) {
    console.error(`Failed to parse tag for character id ${id}`);
  }

  const dialogue_settings = {
    settings: model_description || description,
    voice: fixVoice(voice),
    greeting, scenario,
  };

  try {
    Object.assign(
      dialogue_settings,
      { conversation: tryToParseDialogue(dialogue) }
    );
  } catch (_e) {
    console.error(`Failed to parse dialogue for character id ${id}`);
  }


  const params_override = {};
  if (personality !== '') {
    try {
      const data = tryParseJSONArray(personality);
      Object.assign(params_override, { personality: data });
    } catch (_error) {
      console.error(`Failed to parse personality for character id ${id}`);
    }
  }

  if (row.body !== '') {
    try {
      const body = tryParseJSONArray(row.body);
      Object.assign(params_override, { body });
    } catch (_error) {
      console.error(`Failed to parse body for character id ${id}`);
    }
  }
  if (un_office_value !== '') {
    Object.assign(params_override, JSON.parse(un_office_value));
  }

  const params = buildModelParams(
    character_creation_options,
    { ...style, ...identity, ...dialogue_settings }
  );
  const model_params = { params_override, params };

  const is_deleted = deletetime !== '';

  const social = {
    likes_count: convert2PositiveInt(like),
    followed_count: convert2PositiveInt(follow),
  };

  const avatar_url = avatar === '' ? null : new URL(avatar).pathname;

  return {
    old_id: id, old_uid: user_id,

    is_deleted,
    is_official: is_official === '1',
    status: convertStatus(status),
    avatar_url,

    created_at: formatDate(createtime),
    updated_at: formatDate(updatetime),

    style,
    dialogue: dialogue_settings,
    identity,
    social,
    model_params,
  };
}

function convertStatus(status) {
  switch (status) {
  case '0':
    // 没有文档不知道是什么， 暂时当 public 处理
    return 'public';
  case '1':
    return 'reviewing';
  case '2':
    return 'rejected';
  case '3':
    return 'public';
  case '4':
    return 'private';
  default:
    throw new Error(`Unknown status: ${status}`);
  }
}

function convert2PositiveInt(str) {
  if (str === '') {
    return 0;
  }

  const val = parseInt(str, 10);
  if (isNaN(val)) {
    throw new Error(`Failed to convert to int: ${str}`);
  }
  return Math.max(val, 0);
}

function fixJSONString(str) {
  if (str === '') {
    return '[]';
  }

  if (/\[|\]/.test(str) === false) {
    return `["${str}"]`;
  }

  if (/,/.test(str) === false) {
    const res = str.replace(/" "/g, '", "');
    return res;
  }

  const res =  str
  .replace(/"/g, '')
  .replace(/^\[\[/g, '[')
  .replace(/\]\]$/g, ']')
  .replace('[', '["').replace(']', '"]')
  .split(',')
  .map(s => s.trim())
  .filter(i => i !== '')
  .join('", "');

  return res;
}

function tryParseJSONArray(str) {
  const fixed_str = fixJSONString(str);
  return JSON.parse(fixed_str).map(i => i.trim()).filter(i => i !== "");
}


function tryToParseDialogue(str) {
  if (str === '') {
    return [];
  }

  let fixed_str = str;
  if (/\\""[^\n]/.test(str)) {
    fixed_str = fixed_str.replace(/\\""[^\n]/g, '\\"');
  }
  if (/,[\n|\S]?\]$/.test(fixed_str)) {
    fixed_str = fixed_str.replace(/,[\n|\S]?\]$/g, ']');
  }
  if (/\\[ ]+"/.test(fixed_str)) {
    fixed_str = fixed_str.replace(/\\[ ]+"/g, '\\"');
  }
  if (/ "Hello" /.test(fixed_str)) {
    fixed_str = fixed_str.replace(/ "Hello" /g, ' \\"Hello\\" ');
  }
  return JSON.parse(fixed_str);
}

async function initV1Map(client) {
  const bootstrapSQL = await fs.promises.readFile(
    path.join(__dirname, '../..', 'db/v1', 'characters.sql'),
    'utf-8'
  );

  await client.query(bootstrapSQL);
}

function fixVoice(voice) {
  if (voice === '') {
    return null;
  }
  if (/^vo[0-9]$/.test(voice)) {
    return voice;
  }

  const match = voice.match(/^[v]?[o]?([0-9])$/);
  if (match) {
    return `vo${match[1]}`;
  }

  throw new Error(`Unknown voice format: ${voice}`);
}

export async function lookupCharacters(client, schema, oldIds) {
  const { rows } = await client.query(
    `SELECT id, old_id, owner_id
    FROM v1.characters
    JOIN (SELECT unnest($1::BIGINT[]) AS old_id) AS old_ids USING (old_id)
    JOIN ${schema}.characters USING (id)`,
    [oldIds]
  );

  const map = new Map();
  for (const row of rows) {
    map.set(row.old_id, row);
  }
  return map;
}