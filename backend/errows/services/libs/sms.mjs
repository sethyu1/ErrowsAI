import crypto from 'node:crypto';
import config from 'config';

const { sms: smsConfig } = config;

function md5Hash(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export async function sendSms(mobile, content) {
  const passwordMD5 = md5Hash(smsConfig.password);

  const reqBody = {
    account: smsConfig.account,
    password: passwordMD5,
    mobile: mobile,
    content: content,
    sid: smsConfig.sid
  };

  const response = await fetch(smsConfig.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reqBody)
  });

  const result = await response.json();

  if (result.subStat !== 'r:000') {
    throw new Error(`SMS send failed: ${result.subStat || 'unknown error'}`);
  }

  return result;
}

export function genSmsCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function normalizeMobile(mobile) {
  return mobile.replace(/[\s-]/g, '').trim();
}

export default {
  sendSms,
  genSmsCode,
  normalizeMobile
};
