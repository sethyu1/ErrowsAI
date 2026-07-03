import { vi } from 'vitest';
import {
  getJSON, postJSON, putJSON, deleteJSON,
  postStreamJSON
} from '../lib/api.mjs';
import { test as baseTest } from './user.mjs';

export const mock_ops_service = {
  name: 'ops',
  actions: {
    configuration_session_config_character_get: vi.fn()
    .mockResolvedValue({ turns: 10, probability: 0 }),
    configuration_session_image_keywords_get: vi.fn()
    .mockResolvedValue([])
  }
};

export const test = baseTest.extend({
  sysadmin_token: async ({ broker, user, token }, use) => {
    await broker.call('ops.role_user_set_system_admin', { uid: user.id });
    await use(token);
  },
  permissions: async ({ server, sysadmin_token }, use) => {
    const permissions = await listPermissions(server, sysadmin_token);
    await use(permissions);
  },
  role: async ({ server, sysadmin_token, permissions }, use) => {
    const role = {
      name: 'admin',
      permissions: permissions.map((p) => p.name)
    };
    const res = await createRole(server, sysadmin_token, role);
    Object.assign(role, res);
    await use(role);
    await deleteRole(server, sysadmin_token, role.id);
  }
});

export async function getOpsProfile(server, token) {
  return getJSON(server, '/ops/users/profile', { token });
}

export async function listPermissions(server, token) {
  return getJSON(server, '/ops/permissions', { token });
}

export async function listRoles(server, token) {
  return getJSON(server, '/ops/roles', { token });
}

export async function createRole(server, token, role) {
  return postJSON(
    server, '/ops/roles',
    { token, body: role, }
  );
}

export async function updateRole(server, token, roleId, role) {
  return putJSON(
    server, `/ops/roles/${roleId}`,
    { token, body: role, }
  );
}

export async function deleteRole(server, token, roleId) {
  return deleteJSON(
    server, `/ops/roles/${roleId}`,
    { token }
  );
}

export async function listOpsUsers(server, token, query = {}) {
  return getJSON(server, '/ops/users', { token, query });
}

export async function addUser(server, token, user) {
  return postJSON(
    server, '/ops/users',
    { token, body: user }
  );
}

export async function updateRoleForUser(server, token, uid, role_ids) {
  return putJSON(
    server, `/ops/users/${uid}`,
    { token, body: { roles: role_ids } }
  );
}

export async function getLegalTerms(server, token = null) {
  return getJSON(
    server, '/legal',
    token ? { token } : {}
  );
}

export async function updateLegalTerms(server, token, terms) {
  return putJSON(
    server, '/ops/legals',
    { token, body: { terms } }
  );
}

export async function listOpsCharacters(server, token, query = {}) {
  const list_query = Object.assign({ page: 0, size: 10 }, query);
  return getJSON(
    server, '/ops/characters',
    { token, query: list_query }
  );
}

export async function updateCharacterStatus(server, token, cid, status, reason) {
  return putJSON(
    server, `/ops/characters/${cid}/status`,
    { token, body: { status, reason } }
  );
}

export async function updateCharacterRecommendation(server, token, cid, recommended) {
  return putJSON(
    server, `/ops/characters/${cid}/recommendation`,
    { token, body: { recommended } }
  );
}

export async function uploadImage(server, token, imageStream) {
  return postStreamJSON(
    server, '/ops/assets/images',
    { token, body: imageStream }
  );
}

export async function updatePixelConfig(server, token, pixel_id, access_token, remark) {
  return putJSON(
    server, '/ops/pixel',
    { token, body: { pixel_id, access_token, remark } }
  );
}

export async function listPixelConfigs(server, token, query = {}) {
  const list_query = Object.assign({ page: 0, size: 20 }, query);
  return getJSON(
    server, '/ops/pixel',
    { token, query: list_query }
  );
}