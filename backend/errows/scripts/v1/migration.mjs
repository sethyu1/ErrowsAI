import path from 'node:path';
import fs from 'node:fs/promises';
import { dbClientWrapper } from "../utils.mjs";
import { migrateUsers } from './users.mjs';
import { migrateCharacters } from './characters.mjs';
import { migratePosts } from './posts.mjs';
import { migratePayments } from './payment.mjs';
import { migrateMedia } from './media.mjs';
import { migrate as migrateSessions } from './sessions.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export const command = 'migrate <data_dir>';
export const describe = 'migrate data from v1';
export { builder } from './utils.mjs';

async function commander(client, argv) {
  await bootstrap(client);
  await migrateUsers(client, argv);
  await migratePayments(client, argv);
  await migrateCharacters(client, argv);
  await migratePosts(client, argv);
  await migrateMedia(client, argv);
  await migrateSessions(client, argv);
}

export const handler = dbClientWrapper(commander);

async function bootstrap(client) {
  const bootstrapSQL = await fs.readFile(
    path.join(__dirname, '../..', 'db/v1', 'bootstrap.sql'),
    'utf-8'
  );

  await client.query(bootstrapSQL);
}