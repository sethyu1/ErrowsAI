import fs from 'fs';
import { expect } from 'vitest';
import { getJSON, postJSON, putJSON, deleteJSON, postStreamSSE } from "../lib/api.mjs";
import { test as baseTest } from './character.mjs';

const session_settings = {
  memory: 'short',
  model: 'RPMaster'
};

export const test = baseTest.extend({
  persona: async ({ server, token }, use) => {
    const persona = {
      name: 'persona 1 for chat',
      description: 'description for chat session persona 1'
    };

    const res = await createPersona(server, token, persona);

    await use(Object.assign(persona, res));

    await deleteSessionPersona(server, token, res.id);
  },
  // eslint-disable-next-line no-empty-pattern
  session_settings: ({}, use) => use(session_settings),
  session: async ({ server, token, character, persona, session_settings }, use) => {
    const res = await createSession(
      server, token,
      persona.id,
      character.id,
      session_settings,
    );

    const session = await getSession(server, token, res.id);

    await use(session);

    await deleteSession(server, token, session.id);
  },
  session_advanced_model: async ({ server, token, character }, use) => {
    const persona = await createPersona(
      server, token,
      {
        name: 'persona advanced model',
        description: 'description for advanced model session persona'
      }
    );

    const res = await createSession(
      server, token,
      persona.id,
      character.id,
      { memory: 'short', model: 'RPMaster' },
    );

    const session = await getSession(server, token, res.id);

    await use(session);

    await deleteSession(server, token, session.id);
  },
  session_basic_model: async ({ server, token, character }, use) => {
    const persona = await createPersona(
      server, token,
      {
        name: 'persona basic model',
        description: 'description for basic model session persona'
      }
    );

    const res = await createSession(
      server, token,
      persona.id,
      character.id,
      { memory: 'short', model: 'Butter v1.0' },
    );

    const session = await getSession(server, token, res.id);

    await use(session);

    await deleteSession(server, token, session.id);
  },
  session_user_message: async ({ server, token, session }, use) => {
    const res = await sendSessionMessage(
      server, token,
      session.id,
      'Hello, this is a test message from user.'
    );
    await use(res);
  },
  voice_call: async ({ server, token, session }, use) => {
    const res = await startSessionVoiceCall(server, token, session.id);
    await use(res);
  }
});

export async function createPersona(server, token, persona) {
  const res = await postJSON(
    server,
    '/my/sessions/personas',
    { body: persona, token }
  );
  expect(res).toHaveProperty('id', expect.any(String));
  return res;
}

export async function deleteSessionPersona(server, token, pid) {
  await deleteJSON(
    server,
    `/my/sessions/personas/${pid}`,
    { token }
  );
}

export async function createSession(
  server, token, pid, cid, settings = { ...session_settings }
) {
  const res = await postJSON(
    server,
    `/my/sessions/personas/${pid}/characters/${cid}`,
    { body: settings, token }
  );
  expect(res).toHaveProperty('id', expect.any(String));
  return res;
}

export async function sendSessionMessage(server, token, sid, content) {
  return postJSON(
    server,
    `/my/sessions/${sid}`,
    { body: { content }, token }
  );
}


export async function getSession(server, token, sid) {
  const session = await getJSON(
    server,
    `/my/sessions/${sid}`,
    { token }
  );
  return session;
}

export function updateSessionSettings(server, token, sid, settings) {
  const body = Object.assign(
    { memory: 'short', auto_tts: false, auto_picture: false },
    settings
  );

  return putJSON(
    server,
    `/my/sessions/${sid}`,
    { body, token }
  );
}

export async function deleteSession(server, token, sid) {
  const delRes = await deleteJSON(
    server,
    `/my/sessions/${sid}`,
    { token }
  );
  expect(delRes).toBeUndefined();
}

export async function requestSessionImage(server, token, sid) {
  return postJSON(
    server,
    `/my/sessions/${sid}/messages/character/images`,
    { token }
  );
}

export async function deleteMessage(server, token, sid, mid) {
  return deleteJSON(
    server,
    `/my/sessions/${sid}/messages/${mid}`,
    { token }
  );
}

export async function messageTTS(server, token, sid, mid) {
  return postJSON(
    server,
    `/my/sessions/${sid}/messages/${mid}/tts`,
    { token }
  );
}

export async function listSessions(server, token) {
  return getJSON(server, `/my/sessions`, { token });
}

export async function startSessionVoiceCall(server, token, sid) {
  return postJSON(
    server,
    `/my/sessions/${sid}/call`,
    { token }
  );
}


export async function sendSessionVoiceCallMessage(
  server, token, sid, cid, audio_path
) {
  const voice_stream = fs.createReadStream(audio_path);

  const res = await postStreamSSE(
    server,
    `/my/sessions/${sid}/call/${cid}`,
    { body: voice_stream, token }
  );

  const events = new Map();
  for await (const item of res) {
    const { event, data } = item;
    events.get(event) ?? events.set(event, []);
    events.get(event).push(data);
  }

  return events;
}

export async function endSessionVoiceCall(server, token, sid, cid) {
  return await postJSON(
    server,
    `/my/sessions/${sid}/call/${cid}/hangup`,
    { token }
  );
}

export function isSessionMessage(message) {
  expect(message).toHaveProperty('id', expect.any(String));
  expect(message).toHaveProperty('role', expect.stringMatching(/^(user|character)$/));
  expect(message).toHaveProperty('content', expect.any(String));
  expect(message).toHaveProperty('type', expect.stringMatching(/^(text|image|voice_call|gift)$/));
  expect(message).toHaveProperty('sended_at', expect.any(String));
  expect(message).toHaveProperty('reply_to_id', expect.toBeOneOf([expect.any(String), null]));
  expect(message).toHaveProperty('feedback', expect.toBeOneOf([expect.any(String), null]));
  expect(message).toHaveProperty('info');

  expect(message).toHaveProperty('voice_url', expect.toBeOneOf([expect.any(String), null]));
  const { type } = message;
  if (type === 'voice_call') {
    expect(message.voice_url).not.toBeNull();
    expect(message.info).toHaveProperty('duration', expect.any(Number));
  }

  expect(message).toHaveProperty('image_url', expect.toBeOneOf([expect.any(String), null]));
  if (type === 'image' || type === 'gift') {
    expect(message.image_url).toMatch(/^https?:\/\//);
  }
}

export function isChatReply(reply) {
  expect(reply).toHaveProperty('content', expect.any(String));
  expect(reply).toHaveProperty('type', expect.stringMatching(/^(text|image|voice_call)$/));
  expect(reply).toHaveProperty('reply_message_id', expect.toBeOneOf([expect.any(String), null]));
  expect(reply).toHaveProperty('reply_voice_url', expect.toBeOneOf([expect.any(String), null]));
  expect(reply).toHaveProperty('reply_picture_url', expect.toBeOneOf([expect.any(String), null]));
  if (reply.type === 'image') {
    expect(reply.reply_picture_url).toMatch(/^https?:\/\//);
  }
  if (reply.type === 'voice_call') {
    expect(reply.reply_voice_url).toMatch(/^https?:\/\//);
    expect(reply).toHaveProperty('info');
    expect(reply.info).toHaveProperty('duration', expect.any(Number));
  }
  expect(reply).toHaveProperty('send_message_id', expect.toBeOneOf([expect.any(String), null]));
  expect(reply).toHaveProperty('send_voice_url', expect.toBeOneOf([expect.any(String), null]));
}