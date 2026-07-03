import { test as baseTest } from './session.mjs';
import {
  getJSON, putJSON
} from '../lib/api.mjs';

export const test = baseTest.extend({
});

export async function listSessionImageKeywords(server, token) {
  return getJSON(
    server, '/ops/sessions/image/keywords',
    { token }
  );
}

export async function updateSessionImageKeywords(server, token, keywords) {
  return putJSON(
    server, `/ops/sessions/image/keywords`,
    { token, body: { keywords } }
  );
}

export async function getDefaultSessionMessageConfig(server, token) {
  return getJSON(
    server, '/ops/sessions/image/probability/default',
    { token }
  );
}

export async function updateDefaultSessionMessageConfig(server, token, config) {
  return putJSON(
    server, '/ops/sessions/image/probability/default',
    { token, body: config }
  );
}

export async function getSessionMessageConfig(server, token, cid) {
  return getJSON(
    server, `/ops/sessions/image/probability/character/${cid}`,
    { token }
  );
}

export async function updateCharacterSessionMessageConfig(server, token, cid, config) {
  return putJSON(
    server, `/ops/sessions/image/probability/character/${cid}`,
    { token, body: config }
  );
}
