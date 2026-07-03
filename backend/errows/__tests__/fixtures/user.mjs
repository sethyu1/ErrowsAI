import { vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import mailer from '@errows/mailer';
import { test as baseTest } from './services.mjs';
import { deleteJSON, getJSON, postJSON, putJSON } from '../lib/api.mjs';

const code = '314159';
export const mock_math_random = 0.31415931415931414;

export async function userRegister(server, email, password) {
  const mailSpy = vi.spyOn(mailer, 'sendEmailVerification')
  .mockResolvedValueOnce();
  const randomSpy = vi.spyOn(Math, 'random')
  .mockReturnValue(mock_math_random);

  const res = await postJSON(
    server,
    `/user/register`,
    { body: { email, password } }
  );
  randomSpy.mockRestore();
  mailSpy.mockRestore();

  return res;
}

export async function userEmailVerify(server, uid, code) {
  return postJSON(
    server,
    `/user/verify`,
    { body: { uid, code } }
  );
}

export async function userLogin(server, email, password) {
  return postJSON(
    server,
    `/user/login`,
    { body: { email, password } }
  );
}

export async function userProfile(server, token) {
  return getJSON(
    server,
    '/user/profile',
    { token }
  );
}

export async function deleteAccount(server, token) {
  return deleteJSON(
    server,
    '/user/account',
    { token }
  );
}

export async function createRandomUser(server) {
  const password = randomUUID();
  const email = `${password}@example.com`;
  const { id } = await userRegister(server, email, password);
  await userEmailVerify(server, id, code);
  const { token } = await userLogin(server, email, password);
  return { id, email, password, token };
}

export async function resetPassword(server, newPassword, token) {
  return putJSON(
    server,
    '/user/password',
    { body: { password: newPassword }, token }
  );
}

export async function getMemberInfo(server, token) {
  return getJSON(
    server,
    '/members/info',
    { token }
  );
}

export const test = baseTest.extend({
  // eslint-disable-next-line no-empty-pattern
  password: ({}, use) => use(randomUUID()),
  email: ({ password }, use) => use(`${password}@example.com`),
  uid:  async ({ server, email, password }, use) => {
    const { id } = await userRegister(server, email, password);
    const { token } = await userEmailVerify(server, id, code);
    await use(id);
    await deleteAccount(server, token);
    // wait for account deletion event to complete
    await new Promise(r => setTimeout(r, 100));
  },
  token: async (
    { email, password, uid: _, server },
    use
  ) => {
    const { token } = await userLogin(server, email, password);
    await use(token);
  },
  user: async ({ server, token }, use) => {
    const profile = await userProfile(server, token);
    await use(profile);
  }
});