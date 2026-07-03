import { dbClientWrapper } from "../utils.mjs";
import createBroker from "../broker.mjs";

export const command = 'purge';
export const describe = 'Purge deleted users data';

export const builder = {
  verbose: {
    alias: 'v',
    describe: 'Enable logger',
    type: 'boolean',
    default: false,
  }
};

export async function purge(client, { verbose = false } = {}) {
  const { rows } = await client.query(
    `SELECT id FROM errows.user_archive`
  );

  const broker = await createBroker(verbose);
  await broker.start();
  await broker.waitForServices('errows');

  for (const { id } of rows) {
    console.log({ id });
    await broker.emit('user_account_deleted', { uid: id });
  }

  await broker.stop();
}

export const handler = dbClientWrapper(purge);