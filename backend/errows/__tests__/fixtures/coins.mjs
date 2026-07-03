import _ from 'lodash';
import { postJSON } from '../lib/api.mjs';
import { test as baseTest } from './member.mjs';

/**
 * Creates a CD key for a user with specified payment plan and validity period.
 *
 * @async
 * @param {Object} broker - The broker instance used to make the service call.
 * @param {string|number} uid - The user ID for whom the CD key is being created.
 * @param {Object} params - Parameters for CD key creation.
 * @param {string} params.plan - The payment plan type.
 * @param {string} [params.valid_from] - ISO date string for redeem window start.
 * @param {string} [params.valid_to] - ISO date string for redeem window end.
 * @param {string|null} [params.cdkey=null] - Optional custom CD key string.
 * @param {number} [params.coin_amount=0] - Free coin balance to be associated with the CD key.
 * @returns {Promise<Object>} A promise that resolves with the result of the CD key creation.
 */
export async function createCDKey(broker, uid, params) {
  const {
    plan, valid_from, valid_to, cdkey = null,
    coin_amount = 0
  } = params;

  return broker.call(
    'payment.cdkey_create',
    {
      plan, valid_from, valid_to, key: cdkey,
      coin_amount
    },
    { meta: { user: { uid } } }
  );
}

export function cdkeyRedeem(server, token, key) {
  return postJSON(
    server,
    '/payment/cdkey/redeem',
    { token, body: { key } }
  );
}

function getPrices(broker) {
  return broker.call('payment.prices');
}

export const test = baseTest.extend({
  cdkey_star: async ({ broker, user }, use) => {
    const uid = user.id;
    const validFrom = new Date();
    const validTo = new Date(validFrom.getTime() + 30 * 24 * 60 * 60 * 1000);
    const res = await createCDKey(
      broker, uid,
      { plan: 'star', valid_from: validFrom.toISOString(), valid_to: validTo.toISOString(), coin_amount: 300 }
    );
    await use(res);
  },
  cdkey_luna: async ({ broker, user }, use) => {
    const uid = user.id;
    const validFrom = new Date();
    const validTo = new Date(validFrom.getTime() + 90 * 24 * 60 * 60 * 1000);
    const res = await createCDKey(
      broker, uid,
      { plan: 'luna', valid_from: validFrom.toISOString(), valid_to: validTo.toISOString(), coin_amount: 700 }
    );
    await use(res);
  },
  cdkey_galaxy: async ({ broker, user }, use) => {
    const uid = user.id;
    const validFrom = new Date();
    const validTo = new Date(validFrom.getTime() + 180 * 24 * 60 * 60 * 1000);
    const res = await createCDKey(
      broker, uid,
      { plan: 'galaxy', valid_from: validFrom.toISOString(), valid_to: validTo.toISOString(), coin_amount: 1300 }
    );
    await use(res);
  },
  prices_map: async ({ broker }, use) => {
    const prices = await getPrices(broker);
    const prices_map = _.keyBy(prices, 'action');
    await use(prices_map);
  },
  price_image: async ({ prices_map }, use) => {
    await use(prices_map['image_generation'].amount);
  },
  price_tts: async ({ prices_map }, use) => {
    await use(prices_map['tts'].amount);
  },
  price_video: async ({ prices_map }, use) => {
    await use(prices_map['video_generation'].amount);
  }
});
