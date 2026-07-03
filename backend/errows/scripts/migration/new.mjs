import _ from 'lodash';
import { format } from 'date-fns';
import fs from 'node:fs/promises';
import path from 'node:path';

export const command = 'new <name>';
export const describe = 'Create a new migration file';
export const builder = {
  name: {
    type: 'string',
    describe: 'Name of the migration'
  }
};

const __dirname = path.dirname(new URL(import.meta.url).pathname);
export async function handler(argv) {
  const name = _.snakeCase(argv.name);
  const version = format(new Date(), 'yyyyMMddHHmmss');
  const filename = `${version}_${name}.sql`;
  const filepath = path.resolve(__dirname, '../../db', `migrations/${filename}`);
  await fs.writeFile(filepath, Buffer.from('-- Write your migration SQL here\n'));
  console.log(`Created migration file: ${filepath}`);
}