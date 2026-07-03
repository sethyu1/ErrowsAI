import { getJSON } from '../lib/api.mjs';
import { test as baseTest } from './session.mjs';
import { getMemberInfo } from './user.mjs';

export async function getMemberStats(server, token) {
  return getJSON(
    server,
    '/members/stats',
    { token }
  );
}

export const test = baseTest.extend({
  member: async ({ server, token }, use) => {
    const member = await getMemberInfo(server, token);
    await use(member);
  }
});