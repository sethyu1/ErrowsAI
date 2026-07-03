import { Client } from 'pg';

export async function runCommand(commandFunc, { dir, conf, ...otherArgv }) {
  process.env['NODE_CONFIG_DIR'] = dir;
  process.env['NODE_ENV'] = conf;

  const { default: config } = await import('config');
  const client = new Client(config.pg);

  try {
    await client.connect();
    await commandFunc(client, otherArgv);
  } catch (err) {
    console.error(err.message);
    throw err;
  } finally {
    await client.end();
  }
};

export function dbClientWrapper(commandFunc) {
  return async function (argv) {
    return runCommand(commandFunc, argv);
  };
}
