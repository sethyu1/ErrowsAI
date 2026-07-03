import { OAuth2Client } from "google-auth-library";
import config from 'config';


const { google } = config.oauth;

// export for mocking in tests
export const googleOauth2Client = new OAuth2Client(
  google.clientId,
  google.clientSecret,
  google.redirectUri
);

export async function getGoogleProfile(data) {
  const { access_token } = data;
  googleOauth2Client.setCredentials({ access_token });
  const profileRes = await googleOauth2Client.request({
    url: 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses',
  });

  const profile = profileRes.data;

  return profile;
}