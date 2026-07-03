import { vi, expect } from 'vitest';
import { test as baseTest, deleteAccount, userProfile } from './user.mjs';
import { postJSON } from "../lib/api.mjs";
import { googleOauth2Client } from '../../services/libs/oauth.mjs';

function googleOauthLogin(server, access_token) {
  return postJSON(
    server,
    '/user/login/google',
    { body: { access_token } }
  );
}

function mock_google_people_res(email, name) {
  return {
    "resourceName":"people/115652435312181159233",
    "names":[
      {
        "metadata": {
          "primary":true,
          "source": { "type":"PROFILE", "id":"115652435312181159233" },
          "sourcePrimary":true
        },
        "displayName": name,
        "familyName":"G",
        "givenName":"tee",
        "displayNameLastFirst":"G tee",
        "unstructuredName": name
      }
    ],
    "emailAddresses": [
      {
        "metadata": {
          "primary":true,
          "verified":true,
          "source": { "type":"ACCOUNT", "id":"115652435312181159233" },
          "sourcePrimary":true
        },
        "value": email
      },
    ]
  };
}

export async function google_user_login_or_register(
  server, google_people,
  mock_access_token = 'mock_google_access_token'
) {
  const googlePeopleSpy = vi.spyOn(
    googleOauth2Client,
    'request'
  ).mockResolvedValueOnce({ data: google_people });
  const oauthRes = await googleOauthLogin(server, mock_access_token);
  expect(googlePeopleSpy).toHaveBeenCalledTimes(1);
  googlePeopleSpy.mockRestore();
  return oauthRes;
}

export async function bind_or_create_google_user(
  server, email
) {
  const google_people = mock_google_people_res(email, email);
  const { token } =  await google_user_login_or_register(server, google_people);
  return userProfile(server, token);
}

export const test = baseTest.extend({
  google_people: ({ email, password }, use) => use(
    mock_google_people_res(email, password)
  ),
  google_user_token: async ({ server, google_people }, use) => {
    const oauthRes = await google_user_login_or_register(server, google_people);
    const token = oauthRes.token;
    await use(token);
    await deleteAccount(server, token);
  },
  google_user: async ({ server, google_user_token }, use) => {
    const user = await userProfile(server, google_user_token);
    await use(user);
  }
});