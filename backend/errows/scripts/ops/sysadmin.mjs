import { ServiceBroker } from 'moleculer';

export const command = 'sysadmin <email>';
export const describe = ' Create system administrator user';
export const builder = {
  email: {
    alias: 'e',
    type: 'string',
    describe: 'Email of the sysadmin user',
    demandOption: true,
  }
};

export async function handler(args) {
  const { default: config } = await import('config');
  const { email, verbose } = args;

  const broker = new ServiceBroker({ ...config.commander, logger: verbose });

  await broker.start();
  await broker.waitForServices('user');
  await broker.waitForServices('ops');

  console.log('Creating system administrator user:', email);
  try {
    const { data: [user] } = await broker.call('user.user_list', { q: email });
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }
    const { id: uid } = user;
    await broker.call('ops.role_user_set_system_admin', { uid });
  } finally {
    await broker.stop();
  }
}
