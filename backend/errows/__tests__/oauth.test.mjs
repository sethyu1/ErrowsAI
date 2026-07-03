import { describe, expect } from 'vitest';
import { test, google_user_login_or_register } from './fixtures/oauth.mjs';
import { userProfile, resetPassword } from './fixtures/user.mjs';
import { userLogin } from './fixtures/user.mjs';
import { getMemberInfo } from './fixtures/user.mjs';
import { cdkeyRedeem, createCDKey } from './fixtures/coins.mjs';

const scope = 'errows_oauth_tests';
test.scoped({ scope, services: ['api', 'user', 'payment'] });


describe('Google OAuth Tests', () => {
  test('register', async ({ server,  google_people }) => {

    const email = google_people.emailAddresses[0].value;
    const name = google_people.names[0].displayName;

    const oauthRes = await google_user_login_or_register(server, google_people);
    expect(oauthRes).toHaveProperty('token',  expect.any(String));

    const user = await userProfile(server, oauthRes.token);
    expect(user).toHaveProperty('email', email);
    expect(user).toHaveProperty('name', name);

    const oauth2Res= await google_user_login_or_register(server, google_people);
    expect(oauth2Res).toHaveProperty('token', expect.any(String));

    const user2 = await userProfile(server, oauth2Res.token);
    expect(user2).toHaveProperty('email', email);
    expect(user2).toHaveProperty('name', name);
    expect(user2.id).toBe(user.id);
  });

  test(
    'oauth already registered email',
    async ({ server, user, google_people }) => {
      const email = google_people.emailAddresses[0].value;
      const name = google_people.names[0].displayName;

      expect(email).toBe(user.email);
      expect(name).toBe(user.name);


      const oauthRes = await google_user_login_or_register(server, google_people);
      expect(oauthRes).toHaveProperty('token', expect.any(String));

      const oauthUser = await userProfile(server, oauthRes.token);
      expect(oauthUser).toHaveProperty('email', email);
      expect(oauthUser).toHaveProperty('name', name);
      expect(oauthUser.id).toBe(user.id);
    }
  );

  test('oauth user not set password', async ({ server, google_user, email, password }) => {
    expect(google_user).toHaveProperty('email', email);

    await expect(
      userLogin(server, email, password)
    ).rejects.toThrow('400 - POST /user/login');
  });

  test('oauth user can set and use password', async ({ server, google_user_token, google_user, email }) => {
    expect(google_user).toHaveProperty('email', email);

    const newPassword = 'NewP@ssw0rd-1234';

    // set password for oauth-created user
    await resetPassword(server, newPassword, google_user_token);

    // login with new password should succeed
    const loginRes = await userLogin(server, email, newPassword);
    expect(loginRes).toHaveProperty('token', expect.any(String));
  });

  test(
    'oauth user should init member info',
    async ({ broker, server, google_user_token, google_user, google_people }) => {
      const member = await getMemberInfo(server, google_user_token);
      expect(member).toHaveProperty('plan', 'free');
      const validFrom = new Date();
      const validTo = new Date(validFrom.getTime() + 30 * 24 * 60 * 60 * 1000);
      const star_cdkey = await createCDKey(
        broker, google_user.id,
        { plan: 'star', valid_from: validFrom.toISOString(), valid_to: validTo.toISOString(), coin_amount: 300 }
      );
      expect(star_cdkey).toHaveProperty('display_key', expect.any(String));
      await cdkeyRedeem(server, google_user_token, star_cdkey.display_key ?? star_cdkey.key);
      const updated_member = await getMemberInfo(server, google_user_token);
      expect(updated_member).toHaveProperty('plan', 'star');

      const oauthRes = await google_user_login_or_register(server, google_people);
      const reauthMember = await getMemberInfo(server, oauthRes.token);
      expect(reauthMember).toHaveProperty('plan', 'star');
    }
  );
});