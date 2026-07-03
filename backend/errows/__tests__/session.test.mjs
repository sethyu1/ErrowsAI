import fs from 'node:fs';
import path from 'node:path';
import ai from '@errows/ai';
import {
  vi, describe, beforeEach, expect, afterEach, beforeAll,
  onTestFailed, onTestFinished
} from "vitest";
import { getJSON, postJSON, putJSON } from "./lib/api.mjs";
import {
  test,
  getSession,
  createSession,
  createPersona,
  requestSessionImage,
  deleteMessage,
  sendSessionMessage,
  updateSessionSettings,
  messageTTS,
  listSessions,
  startSessionVoiceCall,
  sendSessionVoiceCallMessage,
  endSessionVoiceCall,
  isChatReply,
  isSessionMessage,
  deleteSessionPersona
} from './fixtures/session.mjs';
import { createRandomUser, deleteAccount } from "./fixtures/user.mjs";
import { createRandomCharacter, getCharacter } from "./fixtures/character.mjs";
import { mockAITtsServer, mockAIVoiceCallServer, mockChatServer } from "./fixtures/ai.mjs";
import { methods as errowsMethods } from '../services/libs/errows.mjs';
import { mock_ops_service } from './fixtures/ops.mjs';
import { mock_payment_service } from './fixtures/payment.mjs';
import { waitingExpectToBeTrue } from './lib/utils.mjs';

const __dirname = new URL('.', import.meta.url).pathname;

const scope = 'errows_sessions_test';

const avatar_url = '/mock-avatar-for-sessions.png';
test.scoped({
  scope, avatar_url,
  services: ['api', 'user', 'errows', mock_payment_service, mock_ops_service],
});

beforeAll(() => {
  vi.spyOn(errowsMethods, 'deductCoinsByImageGen').mockResolvedValue();
});

const image_gen_url = '/generated-image-in-session.png';
beforeEach(() => {
  vi.spyOn(ai, 'avatarGen').mockResolvedValue({ image_url: avatar_url });
  vi.spyOn(ai, 'imageGen').mockResolvedValue({ image_url: image_gen_url });
  vi.spyOn(ai, 'chatCompletion').mockResolvedValue({ reply: 'This is a mock reply.' });
  vi.spyOn(ai, 'tts').mockResolvedValue({ voice_url: 'https://example.com/mock-voice.mp3' });
});


function templateReply(content) {
  return `Echo: ${content}`;
}

async function listSessionPersonas(server, token) {
  return getJSON(
    server,
    '/my/sessions/personas',
    { token }
  );
}

afterEach(() => {
  vi.spyOn(ai, 'chatCompletion').mockImplementation(async ({ messages }) => {
    const userMessage = messages[messages.length - 1];
    return { reply: templateReply(userMessage.content) };
  });
});

describe('session persona', async () => {
  test('create session persona', async ({ persona }) => {
    expect(persona).toHaveProperty('id', expect.any(String));
    expect(persona).toHaveProperty('name', expect.any(String));
    expect(persona).toHaveProperty('description', expect.any(String));
  });

  test(
    'list session personas',
    async ({ server, token, user, persona }) => {
      const res = await listSessionPersonas(server, token);

      expect(res).toBeInstanceOf(Array);
      expect(res).toHaveLength(2);
      expect(res[0]).toMatchObject(persona);
      // The other persona is the default one, create when user init
      expect(res[1]).toMatchObject({ name: user.name });
    }
  );

  test('update session with persona', async ({ server, token, persona }) => {
    const persona_updated = {
      name: 'UpdatedSessionUser',
      description: 'Updated user for session testing'
    };

    const res = await putJSON(
      server,
      `/my/sessions/personas/${persona.id}`,
      { body: persona_updated, token }
    );
    expect(res).toBeUndefined();

    const res_list = await listSessionPersonas(server, token);
    expect(res_list).toBeInstanceOf(Array);
    expect(res_list).toHaveLength(2);
    expect(res_list[0]).toMatchObject({
      ...persona_updated
    });
  });

  test('delete persona removes related sessions from list', async ({
    server, token, character, session_settings
  }) => {
    // Create a new persona
    const new_persona = await createPersona(server, token, {
      name: 'Persona to be deleted',
      description: 'This persona will be deleted'
    });

    // Create a session with this persona
    const session_with_persona = await createSession(
      server, token, new_persona.id, character.id, session_settings
    );

    // Verify session exists in list
    let sessionList = await listSessions(server, token);
    const foundSession = sessionList.find(s => s.id === session_with_persona.id);
    expect(foundSession).toBeDefined();
    expect(foundSession.persona.id).toBe(new_persona.id);

    // Delete the persona
    await deleteSessionPersona(server, token, new_persona.id);

    // Verify persona is removed from list
    const personaList = await listSessionPersonas(server, token);
    const foundPersona = personaList.find(p => p.id === new_persona.id);
    expect(foundPersona).toBeUndefined();

    // Verify session is no longer in the list
    sessionList = await listSessions(server, token);
    const foundSessionAfterDelete = sessionList.find(s => s.id === session_with_persona.id);
    expect(foundSessionAfterDelete).toBeUndefined();

    // Verify trying to get the session returns not found
    await expect(
      getSession(server, token, session_with_persona.id)
    ).rejects.toMatchObject({
      status: 404
    });
  });
});

describe('basic', () => {
  test('create session with persona', async ({ server, token, session }) => {
    isSession(session);
    expect(session.messages).toHaveLength(1);

    const sameSession = await createSession(
      server, token, session.persona.id, session.character.id,
      session.settings
    );
    expect(sameSession).toHaveProperty('id', session.id);

    const sessions = await getSession(server, token, session.id);
    isSession(sessions);
    const [greetingMessage] = sessions.messages;
    expect(greetingMessage).toMatchObject({
      id: session.messages[0].id,
      content: session.messages[0].content,
      role: 'character',
      type: 'image',
      image_url: expect.stringContaining(image_gen_url),
      reply_to_id: null,
      feedback: null,
    });
  });

  test('text chatting in session', async ({ server, token, session, character }) => {
    expect(character.social).toHaveProperty('dialogues_count', 0);
    const user_message_content = "Hello, how are you?";
    const character_message_content = "I am fine, thank you.";

    ai.chatCompletion.mockRestore();
    const {
      tryToCheckRequestCalled, resolveRequest, close
    } = await mockChatServer();

    resolveRequest({ response: character_message_content });
    const res = await sendSessionMessage(
      server, token, session.id, user_message_content
    );
    isChatReply(res);
    await tryToCheckRequestCalled();
    await close();

    const newSession = await getSession(server, token, session.id);
    isSession(newSession);

    expect(newSession.messages).toHaveLength(3);
    const [_, send_message, reply_message] = newSession.messages;

    const { send_message_id, reply_message_id } = res;
    expect(send_message).toMatchObject({
      id: send_message_id, content: user_message_content, type: 'text',
      reply_to_id: null,
      role: 'user', feedback: null,
    });
    expect(reply_message).toMatchObject({
      id: reply_message_id, content: character_message_content, type: 'text',
      reply_to_id: send_message_id,
      role: 'character', feedback: null,
    });

    await waitingExpectToBeTrue(
      () => getCharacter(server, session.character.id),
      (character) => {
        expect(character.social).toHaveProperty('dialogues_count', 1);
      }
    );
  });


  test('message feedback', async ({ server, token, session }) => {
    const { messages: [character_message] } = session;
    const mid = character_message.id;
    const likeRes = await postJSON(
      server,
      `/my/sessions/${session.id}/messages/${mid}/feedback/like`,
      { token }
    );
    expect(likeRes).toBeUndefined();

    const likeSessionRes = await getSession(server, token, session.id);
    const msg = likeSessionRes.messages.find(m => m.id === character_message.id);
    expect(msg).toHaveProperty('feedback', 'like');

    const cancelRes = await postJSON(
      server,
      `/my/sessions/${session.id}/messages/${mid}/feedback/like`,
      { token }
    );
    expect(cancelRes).toBeUndefined();

    const cancelSessionRes = await getSession(server, token, session.id);
    const msg3 = cancelSessionRes.messages.find(m => m.id === character_message.id);
    expect(msg3).toHaveProperty('feedback', null);

    const dislikeRes = await postJSON(
      server,
      `/my/sessions/${session.id}/messages/${mid}/feedback/dislike`,
      { token }
    );
    expect(dislikeRes).toBeUndefined();

    const dislikedSession = await getSession(server, token, session.id);
    const msg2 = dislikedSession.messages.find(m => m.id === character_message.id);
    expect(msg2).toHaveProperty('feedback', 'dislike');

    Object.assign(session, dislikedSession);
  });

  test('update last user message', async (
    { server, token, session, session_user_message }) => {
    const newContent = "I am great, thank you!";
    const newReplyContent = "That's wonderful to hear!";
    ai.chatCompletion.mockResolvedValueOnce({ reply: newReplyContent });

    const {
      send_message_id: user_message_id,
      reply_message_id: character_message_id
    } = session_user_message;

    await expect(putJSON(
      server,
      `/my/sessions/${session.id}/messages/${character_message_id}`,
      { body: { content: newContent }, token }
    ))
    .rejects.toMatchObject({
      status: 403,
      body: {
        message: 'Only the last user message can be updated'
      }
    });

    const res = await putJSON(
      server,
      `/my/sessions/${session.id}/messages/${user_message_id}`,
      { body: { content: newContent }, token }
    );

    isChatReply(res);
    expect(res).toHaveProperty('send_message_id', user_message_id);
    expect(res).toHaveProperty('reply_message_id', character_message_id);

    const newSession = await getSession(server, token, session.id);
    expect(newSession.messages).toHaveLength(3);
    const [_, updated_user_message, updated_character_message] = newSession.messages;
    expect(updated_user_message.content).toEqual(newContent);
    expect(updated_character_message.content).toEqual(newReplyContent);
  });

  test('update session settings', async ({ server, token, session }) => {
    const newSettings = {
      memory: 'long',
      auto_tts: true,
      auto_picture: true,
    };

    const res = await updateSessionSettings(
      server, token, session.id, newSettings
    );
    expect(res).toBeUndefined();

    const newSession = await getSession(server, token, session.id);
    expect(newSession).toHaveProperty('settings', expect.objectContaining(newSettings));
    Object.assign(session, newSession);
  });

  test('list sessions', async ({ server, token, session }) => {
    const res = await listSessions(server, token);

    expect(res).toBeInstanceOf(Array);
    expect(res).toHaveLength(1);
    const [sessionRes] = res;
    expect(sessionRes).not.toHaveProperty('messages');
    const {
      messages,
      ...expectedSessionSummary
    } = session;
    const [greetingMessage] = messages;

    isSessionSummary(sessionRes, {
      ...expectedSessionSummary,
      last_message_preview: greetingMessage.content,
    });
  });

  test('delete last message', async (
    { server, token, session, session_user_message }
  ) => {
    const { id: sid, character: { id: cid } } = session;
    const {
      send_message_id: user_message_id,
      reply_message_id: character_message_id
    } = session_user_message;

    await waitingExpectToBeTrue(
      () => getCharacter(server, cid),
      (character) => {
        expect(character.social).toHaveProperty('dialogues_count', 1);
      }
    );

    await expect(
      deleteMessage(server, token, sid, character_message_id)
    ).rejects.toMatchObject({
      status: 403,
      body: {
        message: 'You can only delete your last message.'
      }
    });

    await expect(
      deleteMessage(server, token, sid, user_message_id)
    ).resolves.toBeUndefined();

    const newSession = await getSession(server, token, sid);
    expect(newSession.messages).toHaveLength(1);
    const [greetingMessage] = newSession.messages;
    expect(greetingMessage).toMatchObject(session.messages[0]);

    await waitingExpectToBeTrue(
      () => getCharacter(server, cid),
      (character) => {
        expect(character.social).toHaveProperty('dialogues_count', 0);
      }
    );
  });

  test("get suggest message", async ({ server, token, session }) => {
    const suggestContent = "This is a suggested reply.";
    ai.chatCompletion.mockRestore();
    const {
      tryToCheckRequestCalled, resolveRequest, close
    } = await mockChatServer();
    onTestFailed(() => close());

    resolveRequest({ response: suggestContent });

    const res = await getJSON(
      server,
      `/my/sessions/${session.id}/messages/suggest`,
      { token }
    );
    await tryToCheckRequestCalled();
    await close();

    expect(res).toHaveProperty('content', suggestContent);
  });
});

describe('image', () => {
  test('request image', async ({ server, token, session, character }) => {
    expect(character.social).toHaveProperty('dialogues_count', 0);
    const { id: sid } = session;
    const image_url = '/image-request-in-session.png';
    ai.avatarGen.mockClear();
    ai.avatarGen.mockResolvedValueOnce({ image_url });

    expect(session).toHaveProperty('messages', expect.any(Array));
    expect(session.messages).toHaveLength(1);

    const requestImageRes = await requestSessionImage(server, token, sid);
    isChatReply(requestImageRes);
    expect(requestImageRes.reply_picture_url).toContain(image_url);

    expect(ai.avatarGen).toBeCalledTimes(1);

    const newSession = await getSession(server, token, sid);
    expect(newSession).toHaveProperty('messages', expect.any(Array));
    expect(newSession.messages).toHaveLength(2);
    newSession.messages.forEach(msg => isSessionMessage(msg));

    const [, image_message] = newSession.messages;
    expect(image_message).toMatchObject({
      id: requestImageRes.reply_message_id,
      role: 'character',
      content: expect.any(String),
      type: 'image',
      image_url: expect.stringContaining(image_url),
      reply_to_id: null,
      feedback: null,
    });

    expect(character.social).toHaveProperty('dialogues_count', 0);
  });
});

describe('tts', () => {
  test('single text message to speech', async ({ server, token, session }) => {
    const { id: sid, messages: [character_message] } = session;
    const voice_url = `/single-tts-${character_message.id}.mp3`;

    ai.tts.mockRestore();
    const {
      tryToCheckRequestCalled, resolveRequest, close
    } = await mockAITtsServer();
    resolveRequest(voice_url);

    const res = await messageTTS(server, token, sid, character_message.id);
    expect(res).toHaveProperty('voice_url', expect.any(String));
    expect(res.voice_url).toMatch(/^http/);
    await tryToCheckRequestCalled();
    await close();

    const updated_session = await getSession(server, token, sid);
    expect(updated_session.messages).toHaveLength(1);
    const [updated_character_message] = updated_session.messages;
    expect(updated_character_message).toHaveProperty(
      'voice_url',
      expect.stringContaining(voice_url)
    );
    expect(updated_character_message.voice_url).toMatch(/^http/);
  });

  test(
    'auto tts for character reply',
    async ({ server, token, session }) => {
      expect(session.settings.auto_tts).toBe(false);
      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].voice_url).toBe(null);

      await updateSessionSettings(
        server, token, session.id, { auto_tts: true }
      );

      const mock_voice_url = '/auto-tts-in-session.mp3';
      const aiTtsSpy = vi.spyOn(ai, 'tts').mockResolvedValueOnce(
        { voice_url: mock_voice_url }
      );
      const ttsReply = await sendSessionMessage(
        server, token, session.id, 'Hello, can you speak now?'
      );
      expect(aiTtsSpy).toHaveBeenCalledTimes(1);
      expect(ttsReply).toHaveProperty(
        'reply_voice_url', expect.stringContaining(mock_voice_url)
      );
      expect(ttsReply.reply_voice_url).toMatch(/^http/);

      const newSession = await getSession(server, token, session.id);
      expect(newSession.messages).toHaveLength(3);
      const [_, , character_message] = newSession.messages;
      expect(character_message).toHaveProperty(
        'voice_url',
        expect.stringContaining(mock_voice_url)
      );
      expect(character_message.voice_url).toMatch(/^http/);
    }
  );
});

describe('talk to character with another user', async () => {
  test('create session', async ({ server, token, persona, session_settings }) => {
    const user = await createRandomUser(server);
    const character = await createRandomCharacter(server, user.token);

    const session = await createSession(
      server, token, persona.id, character.id,
      session_settings
    );
    expect(session).toHaveProperty('id', expect.any(String));
  });
});

describe('start voice call in session', () => {
  test(
    'voice call start',
    async ({ server, token, session }) => {
      const res = await startSessionVoiceCall(server, token, session.id);
      expect(res).toHaveProperty('id', expect.any(String));
      expect(res).toHaveProperty('start_at', expect.any(String));
    }
  );

  test(
    'voice call with voice messages',
    async ({ server, token, session, voice_call }) => {
      const mockVoiceCallResponse = fs.createReadStream(
        path.join(__dirname, './fixtures/assets/voice_call.jsonl')
      );
      const {
        close, resolveRequest, tryToCheckRequestCalled
      } = await mockAIVoiceCallServer();
      resolveRequest(mockVoiceCallResponse);
      onTestFinished(() => close());

      const audio_path = path.join(__dirname, './fixtures/assets/voice_call.wav');
      const events = await sendSessionVoiceCallMessage(
        server, token, session.id, voice_call.id, audio_path
      );

      await tryToCheckRequestCalled();

      expect(events.has('response_sentence')).toBe(true);
      const response_sentence = events.get('response_sentence');
      expect(response_sentence).toBeInstanceOf(Array);
      response_sentence.forEach(
        sentence => expect(sentence).toEqual(expect.any(String))
      );
      expect(response_sentence.length).toEqual(5);

      expect(events.has('error')).toBe(false);
      expect(events.has('end')).toBe(true);
    }
  );

  test('end voice call', async ({ server, token, session, voice_call }) => {
    expect(session.messages).toHaveLength(1);

    const message_reply = await endSessionVoiceCall(
      server, token, session.id, voice_call.id
    );
    isChatReply(message_reply);
    expect(message_reply).toHaveProperty('type', 'voice_call');
    expect(message_reply).toHaveProperty(
      'reply_voice_url',
      expect.stringContaining(`/sessions/${session.id}/${voice_call.id}.wav`)
    );
    expect(message_reply.info).toHaveProperty('duration', expect.any(Number));
    expect(message_reply.info.duration).toBeGreaterThan(0);

    const afterSession = await getSession(server, token, session.id);
    expect(afterSession.messages).toHaveLength(2);
    const [, call_character_message] = afterSession.messages;
    isSessionMessage(call_character_message);
    expect(call_character_message.id).toEqual(voice_call.id);
    expect(call_character_message.type).toEqual('voice_call');
    expect(call_character_message.role).toEqual('user');
    expect(call_character_message.voice_url).toEqual(
      expect.stringContaining(`/sessions/${session.id}/${voice_call.id}.wav`)
    );
    expect(call_character_message.info.duration).toEqual(message_reply.info.duration);
  });
});



describe('handle user deleted', () => {
  test(
    'delete sessions when user deleted',
    async ({ server, token, session }) => {
      const randomUser = await createRandomUser(server);
      const randomCharacter = await createRandomCharacter(server, randomUser.token);


      const { id: sid } = await createSession(
        server, token, session.persona.id, randomCharacter.id
      );

      const sessionList = await listSessions(server, token);
      expect(sessionList).toHaveLength(2);
      expect(sessionList[0]).toHaveProperty('id', sid);

      await deleteAccount(server, randomUser.token);

      const afterSessions = await listSessions(server, token);
      expect(afterSessions).toHaveLength(2);
      expect(afterSessions[0]).toHaveProperty('id', sid);
    }
  );
});

function isCharacter(character) {
  expect(character).toHaveProperty('id', expect.any(String));
  expect(character).toHaveProperty('nickname', expect.any(String));
  expect(character).toHaveProperty('avatar_url', expect.any(String));
  expect(character.avatar_url).toMatch(/^https?:\/\//);
}

function isPersona(persona) {
  expect(persona).toHaveProperty('id', expect.any(String));
  expect(persona).toHaveProperty('name', expect.any(String));
  expect(persona).toHaveProperty('description', expect.any(String));
}

function isSessionSettings(settings) {
  expect(settings).toHaveProperty('memory', expect.any(String));
  expect(settings).toHaveProperty('model', expect.any(String));
  expect(settings).toHaveProperty('auto_tts', expect.any(Boolean));
  expect(settings).toHaveProperty('auto_picture', expect.any(Boolean));
}

function isSession(session) {
  expect(session).toHaveProperty('id', expect.any(String));
  expect(session).toHaveProperty('persona');
  isPersona(session.persona);
  expect(session).toHaveProperty('character');
  isCharacter(session.character);
  expect(session).toHaveProperty('settings');
  isSessionSettings(session.settings);
  expect(session).toHaveProperty('messages', expect.any(Array));
  session.messages.forEach(msg => isSessionMessage(msg));
  expect(session).toHaveProperty('created_at', expect.any(String));
  expect(session).toHaveProperty('updated_at', expect.any(String));
}

function isSessionSummary(summary, expected = {}) {
  expect(summary).toHaveProperty('id', expect.any(String));
  expect(summary).toHaveProperty('last_message_preview', expect.any(String));
  expect(summary).toHaveProperty('last_message_at', expect.any(String));
  expect(summary).toHaveProperty('messages_count', expect.any(Number));
  expect(summary).toHaveProperty('created_at', expect.any(String));
  expect(summary).toHaveProperty('updated_at', expect.any(String));
  expect(summary).toHaveProperty('character');
  isCharacter(summary.character);
  expect(summary).toHaveProperty('persona');
  isPersona(summary.persona);
  expect(summary).toMatchObject(expected);
}

