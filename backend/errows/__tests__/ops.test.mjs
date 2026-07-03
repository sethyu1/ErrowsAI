import { describe, expect, vi } from "vitest";
import {
  createRole, listRoles, updateRole, deleteRole,
  test,
  listOpsUsers,
  addUser,
  updateRoleForUser,
  listPermissions,
  listSessionImageKeywords, updateSessionImageKeywords,
  getDefaultImageProbability, updateDefaultImageProbability,
  getCharacterImageProbability, updateCharacterImageProbability,
  getLegalTerms, updateLegalTerms,
  listOpsCharacters,
  updateCharacterStatus,
  uploadImage,
} from "./fixtures/ops.mjs";
import { getOpsProfile } from "./fixtures/ops.mjs";
import { mock_payment_service } from './fixtures/payment.mjs';
import { randomUUID } from "node:crypto";
import { userLogin } from "./fixtures/user.mjs";
import { isPagination } from "./lib/assert.mjs";
import {
  createRandomCharacter, getCharacter,
  waitingCharacterAvatarGen
} from "./fixtures/character.mjs";
import ai from '@errows/ai';
import { random_gen_image_stream } from './lib/utils.mjs';
import config from 'config';

// Mock AI 头像生成
const avatar_url = '/test-avatar-for-ops.png';
vi.spyOn(ai, 'avatarGen').mockResolvedValue({ image_url: avatar_url });

const scope = 'ops_tests';
test.scoped({
  scope,
  avatar_url,
  services: ['api', 'user', 'ops', 'errows', mock_payment_service]
});

describe('sysadmin & roles', () => {
  test('ops user authorization',
    async ({ server, token }) => {
      await expect(listPermissions(server, token))
      .rejects.toMatchObject({ status: 403 });
    }
  );

  test('system admin', async ({ server, sysadmin_token, permissions }) => {
    const systemUserProfile = await getOpsProfile(server, sysadmin_token);
    isOPUser(systemUserProfile);
    expect(systemUserProfile.roles.length).toEqual(1);
    expect(systemUserProfile.roles[0].builtin).toEqual(true);
    expect(systemUserProfile.sysadmin).toEqual(true);

    // Sysadmin should have all permissions
    expect(systemUserProfile.permissions).toBeInstanceOf(Array);
    expect(systemUserProfile.permissions.length).toEqual(permissions.length);
    expect(systemUserProfile.permissions.length).toBeGreaterThan(0);

    // Verify all permissions are present
    const permissionNames = systemUserProfile.permissions.map(p => p.name).sort();
    const allPermissionNames = permissions.map(p => p.name).sort();
    expect(permissionNames).toEqual(allPermissionNames);
  });

  test('permissions', async ({ permissions }) => {
    expect(permissions).toBeInstanceOf(Array);
    permissions.forEach(isPermission);
    expect(permissions.length).toBeGreaterThan(0);
  });

  test('roles', async ({ server, sysadmin_token, permissions }) => {
    const roles = await listRoles(server, sysadmin_token);
    expect(roles).toBeInstanceOf(Array);
    // not have system roles except sysadmin
    expect(roles.length).toEqual(0);

    const testRole = {
      name: 'test_role',
      permissions: permissions.slice(0, 2).map(p => p.name),
    };
    await createRole(server, sysadmin_token, testRole);

    const beforeRoles = await listRoles(server, sysadmin_token);
    expect(beforeRoles.length).toEqual(1);
    beforeRoles.forEach(isRole);
    expect(beforeRoles[0]).toMatchObject(testRole);

    const newRole= {
      name: 'updated_test_role',
      permissions: permissions.slice(0, 1).map(p => p.name),
    };
    const { id: roleId } = beforeRoles[0];
    await updateRole(server, sysadmin_token, roleId, newRole);
    const afterUpdateRoles = await listRoles(server, sysadmin_token);
    expect(afterUpdateRoles.length).toEqual(1);
    afterUpdateRoles.forEach(isRole);
    expect(afterUpdateRoles[0]).toMatchObject({
      name: newRole.name,
      permissions: newRole.permissions,
    });

    await deleteRole(server, sysadmin_token, roleId);
    const afterDeleteRoles = await listRoles(server, sysadmin_token);
    expect(afterDeleteRoles.length).toEqual(0);
  });

  describe('users', function () {
    test('list users', async ({ server, sysadmin_token, user }) => {
      const res = await listOpsUsers(server, sysadmin_token);
      isPagination(res);
      res.data.forEach(isOPUser);
      expect(res.count).toBeGreaterThan(0);
      expect(res.data.length).toBeGreaterThan(0);
      const found = res.data.find(u => u.email === user.email);
      expect(found).toBeDefined();
      expect(found.sysadmin).toEqual(true);
      expect(found.roles.length).toEqual(0);
    });

    test('list ops user', async ({ server, sysadmin_token }) => {
      const res = await listOpsUsers(
        server, sysadmin_token, { has_op_role: true }
      );
      expect(res).toHaveProperty('count', expect.any(Number));
      expect(res.count).toEqual(1);
      expect(res).toHaveProperty('data', expect.any(Array));
      res.data.forEach(isOPUser);
      expect(res.data.length).toEqual(1);
    });

    test('search ops user', async ({ server, sysadmin_token, user }) => {
      const res = await listOpsUsers(
        server, sysadmin_token, { q: user.email.slice(0, 3) }
      );
      expect(res).toHaveProperty('count', expect.any(Number));
      expect(res.count).toEqual(1);
      expect(res).toHaveProperty('data', expect.any(Array));
      res.data.forEach(isOPUser);
      expect(res.data.length).toEqual(1);

      expect(res.data[0].email).toEqual(user.email);
    });


    test('add user', async ({ server, sysadmin_token, role }) => {
      expect(role.permissions.length).toBeGreaterThan(0);

      const password = randomUUID();
      const email = `${password}@example.com`;

      const newUser = {
        email,
        password,
        name: 'ops add user',
        roles: [role.id]
      };

      await addUser(
        server, sysadmin_token,
        newUser
      );

      const { token } = await userLogin(server, email, password);
      const opsProfile = await getOpsProfile(server, token);
      isOPUser(opsProfile);
      expect(opsProfile).toHaveProperty('email', newUser.email);
      expect(opsProfile).toHaveProperty('name', newUser.name);
      expect(opsProfile.roles.length).toEqual(1);
      expect(opsProfile.roles[0].id).toEqual(role.id);
      expect(opsProfile.permissions.length).toEqual(role.permissions.length);


      const res = await listOpsUsers(
        server, sysadmin_token, { q: newUser.email }
      );
      expect(res).toHaveProperty('count', expect.any(Number));
      expect(res.count).toEqual(1);
      expect(res).toHaveProperty('data', expect.any(Array));
      res.data.forEach(isOPUser);
      expect(res.data.length).toEqual(1);

      expect(res.data[0].email).toEqual(newUser.email);
      expect(res.data[0].name).toEqual(newUser.name);
      expect(res.data[0].roles.length).toEqual(1);
      expect(res.data[0].roles[0].id).toEqual(role.id);
      expect(res.data[0].permissions.length).toEqual(role.permissions.length);
    });

    test(
      'update user roles',
      async ({ server, sysadmin_token, role }) => {
        expect(role.permissions.length).toBeGreaterThan(0);

        const password = randomUUID();
        const email = `${password}@example.com`;

        const newUser = {
          email,
          password,
          name: 'ops add user',
          roles: []
        };

        const { id } = await addUser(
          server, sysadmin_token,
          newUser
        );

        await updateRoleForUser(server, sysadmin_token, id, [role.id]);

        const res = await listOpsUsers(
          server, sysadmin_token, { q: newUser.email }
        );
        expect(res.count).toEqual(1);

        expect(res.data[0].email).toEqual(newUser.email);
        expect(res.data[0].roles.length).toEqual(1);
        expect(res.data[0].roles[0].id).toEqual(role.id);
        expect(res.data[0].permissions.length).toEqual(role.permissions.length);
      }
    );

    test(
      'sysadmin role is automatically preserved when updating user roles',
      async ({ server, sysadmin_token, role, user }) => {
        // Get the initial profile to confirm sysadmin status
        const initialProfile = await getOpsProfile(server, sysadmin_token);
        expect(initialProfile.sysadmin).toEqual(true);

        // Try to update sysadmin user's roles to only include a regular role
        // The system should automatically keep the sysadmin role
        await updateRoleForUser(server, sysadmin_token, user.id, [role.id]);

        // Verify the user still has sysadmin role
        const userProfile = await getOpsProfile(server, sysadmin_token);
        expect(userProfile.sysadmin).toEqual(true);

        // Verify the regular role was added
        const regularRoles = userProfile.roles.filter(r => !r.builtin);
        expect(regularRoles.length).toEqual(1);
        expect(regularRoles[0].id).toEqual(role.id);
      }
    );

    test(
      'can explicitly include sysadmin role when updating user roles',
      async ({ server, sysadmin_token, role, user }) => {
        // Get the sysadmin role ID
        const userProfile = await getOpsProfile(server, sysadmin_token);
        const sysadminRole = userProfile.roles.find(r => r.name === 'sysadmin' && r.builtin === true);
        expect(sysadminRole).toBeDefined();

        // Update roles explicitly including sysadmin role + regular role
        await updateRoleForUser(server, sysadmin_token, user.id, [sysadminRole.id, role.id]);

        // Verify both roles are assigned
        const updatedProfile = await getOpsProfile(server, sysadmin_token);
        expect(updatedProfile.sysadmin).toEqual(true);

        // Verify the regular role was added
        const regularRoles = updatedProfile.roles.filter(r => !r.builtin);
        expect(regularRoles.length).toEqual(1);
        expect(regularRoles[0].id).toEqual(role.id);
      }
    );
  });
});

describe('legal terms', () => {
  test('get and update legal terms', async ({ server, sysadmin_token }) => {
    // 获取初始法律条款（公开接口，无需认证）
    const initTerms = await getLegalTerms(server);
    expect(initTerms).toBeInstanceOf(Array);
    expect(initTerms.length).toEqual(0);

    // 更新法律条款
    const newTerms = [
      { name: 'Privacy Policy', content: 'This is our privacy policy...' },
      { name: 'Terms of Service', content: 'These are our terms of service...' },
      { name: 'Cookie Policy', content: 'This is our cookie policy...' }
    ];
    await updateLegalTerms(server, sysadmin_token, newTerms);

    // 验证更新后的条款
    const updatedTerms = await getLegalTerms(server);
    expect(updatedTerms).toEqual(newTerms);
    expect(updatedTerms.length).toEqual(3);

    // 验证每个条款的结构
    updatedTerms.forEach(term => {
      expect(term).toHaveProperty('name', expect.any(String));
      expect(term).toHaveProperty('content', expect.any(String));
    });

    // 验证可以更新为空数组
    await updateLegalTerms(server, sysadmin_token, []);
    const emptyTerms = await getLegalTerms(server);
    expect(emptyTerms).toBeInstanceOf(Array);
    expect(emptyTerms.length).toEqual(0);
  });
});

describe('ops characters', () => {
  test(
    'list characters with status filter',
    async ({ server, sysadmin_token, token }) => {

      // 创建一个 private 角色用于测试
      const testCharacter = await createRandomCharacter(server, token);
      expect(testCharacter).toHaveProperty('id');
      const { id: cid } = testCharacter;

      // 等待头像生成完成，状态变为 private
      await waitingCharacterAvatarGen(server, token, cid, avatar_url);

      // 验证初始状态为 private
      const initialChar = await getCharacter(server, cid, token);
      expect(initialChar.status).toEqual('private');

      // 获取所有角色（包括所有状态）
      const allCharacters = await listOpsCharacters(server, sysadmin_token);
      isPagination(allCharacters);

      // 验证能找到刚创建的角色
      const foundChar = allCharacters.data.find(c => c.id === cid);
      expect(foundChar).toBeDefined();
      expect(foundChar.status).toEqual('private');

      // 测试 status 过滤 - private
      const privateCharacters = await listOpsCharacters(server, sysadmin_token, { status: 'private' });
      const foundInPrivate = privateCharacters.data.find(c => c.id === cid);
      expect(foundInPrivate).toBeDefined();

      // 修改状态为 public
      await updateCharacterStatus(server, sysadmin_token, cid, 'public');

      // 验证状态已更改
      const publicChar = await getCharacter(server, cid, token);
      expect(publicChar.status).toEqual('public');

      // 测试 status 过滤 - public
      const publicCharacters = await listOpsCharacters(server, sysadmin_token, { status: 'public' });
      const foundInPublic = publicCharacters.data.find(c => c.id === cid);
      expect(foundInPublic).toBeDefined();

      // 修改状态为 rejected，并提供拒绝原因
      const rejectReason = 'Test rejection reason';
      await updateCharacterStatus(server, sysadmin_token, cid, 'rejected', rejectReason);

      // 验证状态已更改为 rejected
      const rejectedChar = await getCharacter(server, cid, token);
      expect(rejectedChar.status).toEqual('rejected');

      // 测试 status 过滤 - rejected
      const rejectedCharacters = await listOpsCharacters(server, sysadmin_token, { status: 'rejected' });
      const foundInRejected = rejectedCharacters.data.find(c => c.id === cid);
      expect(foundInRejected).toBeDefined();

      // 验证不再出现在 public 列表中
      const publicCharactersAfter = await listOpsCharacters(server, sysadmin_token, { status: 'public' });
      const notInPublic = publicCharactersAfter.data.find(c => c.id === cid);
      expect(notInPublic).toBeUndefined();
    });
});

describe('upload image', () => {
  test('upload image', async ({ server, sysadmin_token }) => {
    const imageStream = random_gen_image_stream();
    const res = await uploadImage(server, sysadmin_token, imageStream);

    expect(res).toHaveProperty('url', expect.any(String));
    expect(res.url).toMatch(/^https?:\/\//);
    expect(res.url).toContain(config.assets.baseUrl);
    expect(res.url).toContain('assets/');
    expect(res.url).toMatch(/\.webp$/);
  });

  test('unauthorized user cannot upload image', async ({ server, token }) => {
    const imageStream = random_gen_image_stream();
    await expect(uploadImage(server, token, imageStream))
    .rejects.toMatchObject({ status: 403 });
  });
});


function isPermission(permission) {
  expect(permission).toHaveProperty('group', expect.any(String));
  expect(permission).toHaveProperty('name', expect.any(String));
  expect(permission).toHaveProperty('title', expect.any(String));
}

function isRole(role) {
  expect(role).toHaveProperty('id', expect.any(String));
  expect(role).toHaveProperty('builtin', expect.any(Boolean));
  expect(role).toHaveProperty('name', expect.any(String));
  expect(role).toHaveProperty('permissions', expect.any(Array));
  role.permissions.forEach(perm => expect(perm).toEqual(expect.any(String)));
}

function isOPUser(user) {
  expect(user).toHaveProperty('id', expect.any(String));
  expect(user).toHaveProperty('sysadmin', expect.any(Boolean));
  expect(user).toHaveProperty('name', expect.any(String));
  expect(user).toHaveProperty('email', expect.any(String));
  expect(user).toHaveProperty('roles', expect.any(Array));
  user.roles.forEach(isRole);
  expect(user).toHaveProperty('permissions', expect.any(Array));
  user.permissions.forEach(isPermission);
}