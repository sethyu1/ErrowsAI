import { test as baseTest } from './ops.mjs';
import { getJSON, postJSON } from '../lib/api.mjs';

export const test = baseTest.extend({
});

export async function createSupport(server, support) {
  return await postJSON(
    server,
    '/supports',
    { body: support }
  );
}

export async function listSupports(server, token, query = {}) {
  return getJSON(
    server, '/ops/supports', { token, query }
  );
}