import { OAuth2Client } from 'google-auth-library';
import config from 'config';
const {
  clientId, secret, redirectUri
} = config.oauth.google;

export const command = 'google';
export const describe = 'Google OAuth operations';
export const builder = {};

const oauth2Client = new OAuth2Client(
  clientId,
  secret,
  redirectUri
);

export async function handler() {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/userinfo.profile',
  });

  console.log('Authorize this app by visiting this url:', url);
}