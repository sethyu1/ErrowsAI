import fs from "node:fs/promises";
import path from "node:path";
import { runCommand } from "./utils.mjs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
export async function bootstrap(client, { schema = 'errows' } = {}) {
  const bootstrapSQL = await fs.readFile(
    path.join(__dirname, '..', 'db', 'bootstrap.sql'),
    'utf-8'
  );

  await client.query('BEGIN;');
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
    await client.query(`SET search_path TO "${schema}", public;`);
    await client.query(bootstrapSQL);
    await client.query(`SET search_path TO public;`);
    await client.query('COMMIT;');
  } catch (err) {
    await client.query('ROLLBACK;');
    throw err;
  }
}

export function handler(args) {
  return runCommand(bootstrap, args);
}

export default {
  command: 'bootstrap',
  desc: '初始化 Errows 数据库',
  handler,
};