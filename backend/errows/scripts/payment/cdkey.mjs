import { ServiceBroker } from 'moleculer';

export const command = 'cdkey <uid>';
export const describe = 'cdkey create';
export const builder = {
  uid: {
    alias: 'u',
    type: 'string',
    describe: 'Issuer ID (UUID)',
    demandOption: true,
  },
  plan: {
    type: 'string',
    alias: 'p',
    describe: 'member plan',
    default: 'free',
    options: ['free', 'star', 'luna', 'galaxy'],
  },
  coin_amount: {
    describe: 'Coin amount',
    type: 'number',
    default: 10,
  },
  count: {
    describe: 'Number of CD keys to create',
    alias: 'n',
    type: 'number',
    default: 1,
  },
  verbose: {
    alias: 'v',
    describe: 'Enable logger',
    type: 'boolean',
    default: false,
  }
};

export async function handler(args) {
  const { default: config } = await import('config');

  const {
    plan, coin_amount, count, verbose,
    uid
  } = args;
  const broker = new ServiceBroker({
    ...config.commander,
    logger: verbose
  });

  await broker.start();
  await broker.waitForServices('payment');

  const validFrom = new Date();
  const validTo = new Date(validFrom.getTime() + 30 * 24 * 60 * 60 * 1000);
  console.log('Key, Plan, Coin Amount');
  try {
    for (let i = 0; i < count; i++) {
      const res = await broker.call(
        'payment.cdkey_create',
        { plan, coin_amount, valid_from: validFrom.toISOString(), valid_to: validTo.toISOString() },
        { meta: { user: { uid } } }
      );
      console.log(`${res.display_key ?? res.key}, ${res.plan}, ${res.coin_amount}`);
    }
  } finally {
    await broker.stop();
  }
}