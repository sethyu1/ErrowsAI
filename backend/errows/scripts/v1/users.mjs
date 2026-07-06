import path from 'node:path';
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { dbClientWrapper } from '../utils.mjs';
import { formatDate } from './utils.mjs';


export const command = 'users <data_dir>';
export const describe = 'migrate users data from v1';
export const builder = {
  data_dir: {
    describe: 'Path to v1 data directory',
    type: 'string',
    demandOption: true
  }
};

export const handler = dbClientWrapper(migrateUsers);
export async function migrateUsers(client, argv) {
  const { verbose } = argv;
  const { default: config } = await import('config');
  const schema = config.scope;

  const user_csv = path.join(argv.data_dir, 'business_user.csv');
  const parser = parse({ columns: true, delimiter: ',' });
  fs.createReadStream(user_csv, 'utf-8').pipe(parser);

  const users = [];
  for await (const row of parser) {
    const { id: old_id } = row;
    if (old_id === "") {
      verbose && console.warn('skipping user with empty id');
      continue;
    }

    const user = formatUser(row);
    const { is_deleted } = user;

    if (is_deleted) {
      await client.query(`DELETE FROM v1.users WHERE old_id = $1`, [old_id]);
      verbose && console.log(`deleted user id=${old_id} from v1.users`);
      continue;
    }

    users.push(user);
  }

  for (const user of users) {
    const {
      old_id, name, profile, email, password,
      createdAt, updatedAt
    } = user;

    await client.query(
      `WITH email_record AS (
        INSERT INTO ${schema}.user_email
          (uid, email, created_at, updated_at, verified_at)
        VALUES (GEN_RANDOM_UUID(), $4, $5, $6, NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING uid
      ),
      binding_old_uid AS (
        INSERT INTO v1.users (id, old_id)
        SELECT uid, $1
        FROM (
          SELECT uid FROM email_record
          UNION
          SELECT uid FROM ${schema}.user_email WHERE email = $4
        ) AS existing_users
        ON CONFLICT DO NOTHING
        RETURNING id
      )
      INSERT INTO ${schema}.users (id, name, profile, created_at, updated_at)
      SELECT uid, $2, $3, $5, $6
      FROM email_record
      RETURNING id`,
      [
        old_id, name, profile, email,
        createdAt, updatedAt
      ]
    )
    .catch((err) => {
      console.error(`Failed to migrate user id=${old_id}:`, err);
      throw err;
    });

    if (password) {
      await client.query(
        `INSERT INTO "${schema}".user_password (uid, hash, created_at)
        SELECT id, $2, $3 FROM v1.users WHERE old_id = $1
        ON CONFLICT (uid) DO UPDATE
          SET hash = EXCLUDED.hash,
              created_at = EXCLUDED.created_at`,
        [old_id, password, createdAt]
      );
    }
  }
};

function formatUser(row) {
  const {
    id: old_id, nickname: name, email, sex, avatar,
    password,
    deletetime
  } = row;

  const createdAt = formatDate(row.createtime);
  const updatedAt = formatDate(row.updatetime);

  const profile = {};
  if (sex == '1') { Object.assign(profile, { gender: 'male' }); }
  else if (sex == '2') { Object.assign(profile, { gender: 'female' }); }

  if (avatar && (avatar.startsWith('https://example.com/') === false)) {
    Object.assign(profile, { avatar });
  }

  const is_deleted = deletetime !== '';

  return {
    is_deleted,
    old_id,
    name,
    email,
    profile,
    password,
    createdAt,
    updatedAt
  };
}

export async function lookupOldUsers(client, schema, old_ids) {
  const { rows } = await client.query(
    `SELECT old_id, id, name FROM v1.users
    JOIN (SELECT UNNEST($1::bigint[]) AS old_id) AS old_ids USING (old_id)
    JOIN ${schema}.users USING(id)`,
    [old_ids]
  );

  const map = new Map(rows.map(row => [row.old_id, row]));
  return map;
}

const OFFICIAL_EMAIL = 'Official@example.com';
const OFFICIAL_NAME = 'Errows Official';
export async function ensureOfficeUser(client, schema) {
  const { rows } = await client.query(
    `WITH prepare_email AS (
      INSERT INTO ${schema}.user_email (uid, email, verified_at)
      VALUES (GEN_RANDOM_UUID(), $1, NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING uid
    ),
    prepare_user AS (
      INSERT INTO ${schema}.users (id, name)
      SELECT uid, $2 FROM prepare_email
      RETURNING id
    )
    SELECT id FROM prepare_user
    UNION
    SELECT uid AS id FROM ${schema}.user_email WHERE email = $1`,
    [OFFICIAL_EMAIL, OFFICIAL_NAME]
  );

  return rows[0].id;
}
