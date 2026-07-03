import { describe, expect } from 'vitest';
import { vi } from 'vitest';
import { randomUUID } from 'crypto';
import mailer from '@errows/mailer';
import {
  test, mock_math_random,
  userEmailVerify,
  userLogin,
  deleteAccount,
  userRegister,
  userProfile,
  resetPassword,
} from './fixtures/user.mjs';
import { getJSON, postJSON, putJSON, postStreamJSON } from './lib/api.mjs';
import { random_gen_image_stream } from './lib/utils.mjs';
import { listMyCharacters } from './fixtures/character.mjs';
import { mock_payment_service } from './fixtures/payment.mjs';

const scope = 'errows_user_tests';
const mock_errows_service = {
  name: 'errows',
  actions: {
    character_list_my: vi.fn()
    .mockResolvedValue({ count: 0, characters: [] })
  }
};

test.scoped({
  scope,
  services: [ 'user', 'api', mock_payment_service, mock_errows_service ]
});

describe('User Service', () => {
  test('should create a new user', async ({ server }) => {
    const email = 'user_test@example.com';
    const password = 'test_test_password';
    const mockVerifyMailSend = vi.spyOn(mailer, 'sendEmailVerification')
    .mockResolvedValueOnce();
    const spyRandom = vi.spyOn(Math, 'random').mockReturnValue(mock_math_random);


    const res = await postJSON(
      server, '/user/register',
      { body: { email, password } }
    );
    spyRandom.mockRestore();
    expect(res).toHaveProperty('id');

    const uid = res.id;
    expect(mailer.sendEmailVerification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({}),
      expect.objectContaining({ to: email }),
      `https://errows.ai/verify?uid=${uid}&code=314159&type=1`
    );

    mockVerifyMailSend.mockRestore();
  });

  test('verify code gen rate limit', async ({ server }) => {
    const password = randomUUID();
    const email = `${password}@example.com`;

    const mockVerifyMailSendSpy = vi.spyOn(mailer, 'sendEmailVerification');

    mockVerifyMailSendSpy.mockResolvedValueOnce();
    const { id: uid } = await postJSON(
      server, '/user/register',
      { body: { email, password } }
    );
    expect(mockVerifyMailSendSpy).toHaveBeenCalledTimes(1);

    mockVerifyMailSendSpy.mockClear();
    mockVerifyMailSendSpy.mockResolvedValueOnce();
    await expect(postJSON(
      server, '/user/register',
      { body: { email, password } }
    )).rejects.toMatchObject({ status: 429 });
    expect(mockVerifyMailSendSpy).toHaveBeenCalledTimes(0);

    vi.useFakeTimers();
    vi.advanceTimersByTime(3 * 60 * 1000 + 1);
    const spyRandom = vi.spyOn(Math, 'random').mockReturnValue(mock_math_random);

    mockVerifyMailSendSpy.mockClear();
    mockVerifyMailSendSpy.mockResolvedValueOnce();
    await expect(postJSON(
      server, '/user/register',
      { body: { email, password } }
    )).resolves.toBeTruthy();
    vi.useRealTimers();
    spyRandom.mockRestore();

    expect(mailer.sendEmailVerification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({}),
      expect.objectContaining({ to: email }),
      `https://errows.ai/verify?uid=${uid}&code=314159&type=1`
    );
    mockVerifyMailSendSpy.mockRestore();
  });

  test('unverified email can not login', async ({ server }) => {
    const password = randomUUID();
    const email = `${password}@example.com`;
    await userRegister(server, email, password);

    await expect(
      postJSON(server,
        '/user/login',
        { body: { email: email, password } }
      )
    ).rejects.toThrow('401 - POST /user/login');
  });

  test('verify email & login', async ({ server }) => {
    const password = randomUUID();
    const email = `${password}@example.com`;

    const { id: uid } = await userRegister(server, email, password);

    await expect(
      postJSON(server, '/user/verify', {
        body: { uid, code: 'wrong_code' }
      })
    ).rejects.toThrow('400 - POST /user/verify');

    const res = await postJSON(server, '/user/verify', {
      body: { uid, code: '314159' }
    });

    await expect(postJSON(server, '/user/verify', {
      body: { uid, code: '314159' }
    })).rejects.toMatchObject({
      status: 400,
      body: { message: 'Verification code mismatch.' }
    });

    expect(res).toHaveProperty('token', expect.any(String));
  });

  test('duplicate registration', async ({ server, user, password }) => {
    const mockVerifyMailSend = vi.spyOn(mailer, 'sendEmailVerification').mockResolvedValueOnce();
    await expect(postJSON(
      server, '/user/register',
      { body: { email: user.email, password } }
    )).rejects.toMatchObject({
      status: 400,
      body: { message: 'Email is already registered.' }
    });
    mockVerifyMailSend.mockRestore();
  });

  test('user profile', async ({ server, token, user }) => {
    await expect(getJSON(server, '/user/profile'))
    .rejects.toThrow('401 - GET /user/profile');

    const res = await getJSON(server, '/user/profile', { token });
    isUser(res);
    expect(res).toEqual(expect.objectContaining(user));
    expect(res.name).toEqual(user.email.split('@')[0]);
  });

  test('user login', async ({ server, user, password }) => {
    await expect(
      postJSON(server,
        '/user/login',
        { body: { email: user.email, password: 'wrong password' } }
      )
    ).rejects.toMatchObject({
      status: 400,
      body: { message: 'Incorrect email or password.' }
    });

    const res = await postJSON(server,
      '/user/login',
      { body: { email: user.email, password } }
    );

    expect(res).toHaveProperty('token', expect.any(String));
    const profile = await userProfile(server, res.token);
    isUser(profile);
  });
});

describe('profile', () => {
  test('update profile', async ({ server, user, token }) => {
    const newName = 'New Name';
    const gender = 'Female';

    expect(user).toHaveProperty('name', expect.any(String));
    expect(user.name).not.toBe(newName);
    expect(user).toHaveProperty('profile', expect.any(Object));
    expect(user.profile).not.toHaveProperty('gender');

    const res = await putJSON(
      server,
      '/user/profile',
      { body: { name: newName, gender }, token }
    );
    expect(res).toBeUndefined();

    const updatedUser = await userProfile(server, token);
    expect(updatedUser).toHaveProperty('name', newName);
    expect(updatedUser).toHaveProperty('profile', { avatar: null, gender });
  });

  test('upload avatar', async ({ server, token, user}) => {
    expect(user).toHaveProperty('profile', expect.any(Object));
    expect(user.profile).not.toHaveProperty('avatar_url');

    const image = random_gen_image_stream();
    const res = await postStreamJSON(
      server, `/user/avatar`,
      { token, body: image }
    );
    expect(res).toHaveProperty('avatar_url', expect.stringMatching(/avatars\/.+/));
    expect(res.avatar_url).toContain('http');

    const updatedUser = await userProfile(server, token);
    expect(updatedUser).toHaveProperty(
      'profile.avatar',
      expect.stringMatching(/avatars\/.+/)
    );
    expect(updatedUser.profile.avatar).toContain('http');
  });
});

describe('forgot password', () => {
  test('forgot password mail', async ({ server, user }) => {
    vi.useFakeTimers();
    vi.advanceTimersByTime(3 * 60 * 1000 + 1);
    vi.spyOn(mailer, 'sendEmailVerification').mockResolvedValueOnce();

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(mock_math_random);

    await postJSON(
      server, '/user/password/forgot',
      { body: { email: user.email } }
    );
    randomSpy.mockRestore();
    vi.useRealTimers();

    expect(mailer.sendEmailVerification).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({}),
      expect.objectContaining({ to: user.email }),
      `https://errows.ai/verify?uid=${user.id}&code=314159&type=2`
    );
    mailer.sendEmailVerification.mockRestore();

    await expect(
      userEmailVerify(server, user.id, 'wrong_code')
    ).rejects.toThrow('400');

    const res = await userEmailVerify(server, user.id, '314159');
    expect(res).toHaveProperty('token', expect.any(String));
    await userProfile(server, res.token);
  });

  test('reset password', async ({ server, token, user }) => {
    const newPassword = 'new_password_123';

    await expect(userLogin(server, user.email, newPassword))
    .rejects.toThrow('400 - POST /user/login');

    await expect(
      resetPassword(server, newPassword, token)
    ).resolves.toBeUndefined();

    await expect(
      userLogin(server, user.email, newPassword)
    ).resolves.toHaveProperty('token', expect.any(String));
  });
});

describe('delete account', () => {
  test('delete user account', async ({ server, email, password }) => {
    const { id } = await userRegister(server, email, password);
    const { token } = await userEmailVerify(server, id, '314159');

    await expect(
      userProfile(server, token)
    ).resolves.toBeTruthy();

    await expect(
      deleteAccount(server, token)
    ).resolves.toBeUndefined();

    await expect(
      userProfile(server, token)
    ).rejects.toThrow('401 - GET /user/profile');

    await expect(
      listMyCharacters(server, token, 'owned')
    ).rejects.toThrow('401 - GET /my/characters/owned');

    const reRegister = await userRegister(server, email, password);
    expect(reRegister).toHaveProperty('id', expect.any(String));
    expect(reRegister.id).not.toBe(id);
    const { token: newToken } = await userEmailVerify(server, reRegister.id, '314159');
    await expect(
      userProfile(server, newToken)
    ).resolves.toBeTruthy();
  });
});


function isUser(user) {
  expect(user).toHaveProperty('id', expect.any(String));
  expect(user).toHaveProperty('email', expect.any(String));
  expect(user).toHaveProperty('name', expect.any(String));
}


