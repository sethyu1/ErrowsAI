import { dbClientWrapper } from '../utils.mjs';

async function drop(client, { schema = 'errows' } = {}) {
  await client.query('BEGIN;');
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE;`);
    await client.query('DELETE FROM schema_migrations WHERE scope = $1;', [schema]);
    await client.query('COMMIT;');
  } catch (err) {
    await client.query('ROLLBACK;');
    throw err;
  }
}

export const handler = dbClientWrapper(drop);