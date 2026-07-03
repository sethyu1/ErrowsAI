import {
  vi, expect, describe, beforeEach
} from 'vitest';
import ai from '@errows/ai';
import {
  test,
  listSessionImageKeywords,
  updateSessionImageKeywords,
  getDefaultSessionMessageConfig,
  updateDefaultSessionMessageConfig,
  getSessionMessageConfig,
  updateCharacterSessionMessageConfig
} from './fixtures/message.mjs';
import { getSession, isChatReply, sendSessionMessage, updateSessionSettings } from './fixtures/session.mjs';

const scope = 'session_message_tests';
const avatar_url = 'session_message_test_avatar.png';
const image_gen_url = 'session_message_test_image.png';
test.scoped({
  scope, avatar_url,
  services: ['errows', 'user', 'payment', 'ops', 'api']
});

beforeEach(() => {
  vi.spyOn(ai, 'avatarGen').mockResolvedValue({ image_url: avatar_url });
  vi.spyOn(ai, 'imageGen').mockResolvedValue({ image_url: image_gen_url });
  vi.spyOn(ai, 'chatCompletion').mockResolvedValue({ reply: 'This is a test reply from AI.' });
});

describe('character session config', () => {
  test('keywords', async ({ server, sysadmin_token }) => {
    const initKeywords = await listSessionImageKeywords(server, sysadmin_token);
    expect(initKeywords).toBeInstanceOf(Array);
    expect( initKeywords.length ).toEqual(0);

    const keywordsToAdd = ['fantasy', 'cyberpunk', 'dark'];
    await updateSessionImageKeywords(server, sysadmin_token, keywordsToAdd);

    const updatedKeywords = await listSessionImageKeywords(server, sysadmin_token);
    expect(updatedKeywords).toEqual(keywordsToAdd);
  });

  test('default session config', async ({ server, sysadmin_token }) => {
    const initConfig = await getDefaultSessionMessageConfig(server, sysadmin_token);
    isSessionConfig(initConfig);
    expect(initConfig.turns).toEqual(0);
    expect(initConfig.probability).toEqual(0);

    const newConfig = { turns: 5, probability: 80 };
    await updateDefaultSessionMessageConfig(server, sysadmin_token, newConfig);

    const updatedConfig = await getDefaultSessionMessageConfig(server, sysadmin_token);
    expect(updatedConfig).toEqual(newConfig);
  });

  test('character session config', async ({ server, character, sysadmin_token }) => {
    const { id: cid } = character;

    // 获取初始配置，应该返回当前默认配置
    const initConfig = await getSessionMessageConfig(server, sysadmin_token, cid);
    isSessionConfig(initConfig);

    // 记录当前默认配置
    const defaultTurns = initConfig.turns;
    const defaultProbability = initConfig.probability;

    // 更新角色特定的配置
    const characterConfig = { turns: 10, probability: 60 };
    await updateCharacterSessionMessageConfig(server, sysadmin_token, cid, characterConfig);

    // 验证更新后的配置
    const updatedConfig = await getSessionMessageConfig(server, sysadmin_token, cid);
    expect(updatedConfig).toEqual(characterConfig);

    // 验证另一个角色仍然使用默认配置
    const anotherCid = 'test-character-id-002';
    const anotherConfig = await getSessionMessageConfig(server, sysadmin_token, anotherCid);
    expect(anotherConfig.turns).toEqual(defaultTurns);
    expect(anotherConfig.probability).toEqual(defaultProbability);
  });
});

describe('session message quota limit', () => {
  describe('free plan', async () => {
    test(
      'session message quota enforcement',
      async ({
        server, token, sysadmin_token,
        character, session
      }) => {
        const quota = 2;
        await updateDefaultSessionMessageConfig(
          server, sysadmin_token,
          { turns: quota, probability: 0 }
        );
        const defaultSessionConfig = await getDefaultSessionMessageConfig(
          server, sysadmin_token
        );
        expect(defaultSessionConfig).toHaveProperty('turns', quota);

        const characterSessionConfig = await getSessionMessageConfig(
          server, sysadmin_token, character.id
        );
        expect(characterSessionConfig).toHaveProperty('turns', 2);

        // 发送消息，消耗配额
        for (let i = 0; i < quota; i++) {
          await expect(sendSessionMessage(
            server, token, session.id,
            'Hello, this is a test message.'
          )).resolves.toBeTruthy();
        }

        await expect(sendSessionMessage(
          server, token, session.id,
          'This message should exceed the quota.'
        )).rejects.toMatchObject({
          status: 402,
          body: {
            message: 'Text message quota exceeded.'
          }
        });
      }
    );

    test(
      'session message quota enforcement for specific character',
      async ({
        server, token, sysadmin_token,
        character, session
      }) => {
        const quota = 2;
        await updateDefaultSessionMessageConfig(
          server, sysadmin_token,
          { turns: quota, probability: 0 }
        );
        const defaultSessionConfig = await getDefaultSessionMessageConfig(
          server, sysadmin_token
        );
        expect(defaultSessionConfig).toHaveProperty('turns', quota);

        await updateCharacterSessionMessageConfig(
          server, sysadmin_token,
          character.id,
          { turns: quota - 1, probability: 0 }
        );
        const characterSessionConfig = await getSessionMessageConfig(
          server, sysadmin_token, character.id
        );
        expect(characterSessionConfig).toHaveProperty('turns', quota - 1);

        // 发送消息，消耗配额
        for (let i = 0; i < quota - 1; i++) {
          await expect(sendSessionMessage(
            server, token, session.id,
            'Hello, this is a test message.'
          )).resolves.toBeTruthy();
        }

        await expect(sendSessionMessage(
          server, token, session.id,
          'This message should exceed the quota.'
        )).rejects.toMatchObject({
          status: 402,
          body: {
            type: "SESSION_MESSAGE_QUOTA_EXCEEDED",
            message: 'Text message quota exceeded.'
          }
        });
      }
    );
  });

  describe('member plan', async () => {
    test(
      'star plan, basic model unlimited',
      async ({
        server, token, sysadmin_token,
        member_star_monthly,
        character, session_basic_model, session_advanced_model
      }) => {
        expect(member_star_monthly).toHaveProperty(
          'session_message_quotas',
          { basic: -1, advanced: null }
        );

        const quota = 0;
        await updateCharacterSessionMessageConfig(
          server, sysadmin_token,
          character.id,
          { turns: quota, probability: 0 }
        );
        const characterSessionConfig = await getSessionMessageConfig(
          server, sysadmin_token, character.id
        );
        expect(characterSessionConfig).toHaveProperty('turns', quota);

        expect(
          session_basic_model.settings
        ).toHaveProperty('model', 'Butter v1.0');

        await expect(sendSessionMessage(
          server, token, session_basic_model.id,
          'Hello, this is a test message.'
        )).resolves.toBeTruthy();

        expect(
          session_advanced_model.settings
        ).toHaveProperty('model', 'RPMaster');

        await expect(sendSessionMessage(
          server, token, session_advanced_model.id,
          'Hello, this is a test message.'
        )).rejects.toMatchObject({
          status: 402,
          body: {
            type: "SESSION_MESSAGE_QUOTA_EXCEEDED",
            message: 'Text message quota exceeded.'
          }
        });
      });

    test('luna plan, advanced model with quota', async ({
      server, token, sysadmin_token,
      member_luna_monthly,
      character, session_advanced_model
    }) => {
      expect(member_luna_monthly).toHaveProperty(
        'session_message_quotas',
        { basic: -1, advanced: 3000 }
      );

      const quota = 0;
      await updateCharacterSessionMessageConfig(
        server, sysadmin_token,
        character.id,
        { turns: quota, probability: 0 }
      );
      const characterSessionConfig = await getSessionMessageConfig(
        server, sysadmin_token, character.id
      );
      expect(characterSessionConfig).toHaveProperty('turns', quota);

      expect(
        session_advanced_model.settings
      ).toHaveProperty('model', 'RPMaster');

      await expect(sendSessionMessage(
        server, token, session_advanced_model.id,
        'Hello, this is a test message.'
      )).resolves.toBeTruthy();
    });

    test('galaxy plan, all models unlimited', async ({
      server, token, sysadmin_token,
      member_galaxy_monthly,
      character, session_basic_model, session_advanced_model
    }) => {
      expect(member_galaxy_monthly).toHaveProperty(
        'session_message_quotas',
        { basic: -1, advanced: -1 }
      );

      const quota = 0;
      await updateCharacterSessionMessageConfig(
        server, sysadmin_token,
        character.id,
        { turns: quota, probability: 0 }
      );
      const characterSessionConfig = await getSessionMessageConfig(
        server, sysadmin_token, character.id
      );
      expect(characterSessionConfig).toHaveProperty('turns', quota);

      expect(
        session_basic_model.settings
      ).toHaveProperty('model', 'Butter v1.0');

      await expect(sendSessionMessage(
        server, token, session_basic_model.id,
        'Hello, this is a test message.'
      )).resolves.toBeTruthy();

      expect(
        session_advanced_model.settings
      ).toHaveProperty('model', 'RPMaster');

      await expect(sendSessionMessage(
        server, token, session_advanced_model.id,
        'Hello, this is a test message.'
      )).resolves.toBeTruthy();
    });
  });
});


describe('session message with random image generation', () => {
  test(
    'message-triggered image generation',
    async ({
      server, token, sysadmin_token,
      character, session
    }) => {
      const config = { turns: 5, probability: 100 };
      await updateCharacterSessionMessageConfig(
        server, sysadmin_token,
        character.id,
        config
      );
      const characterSessionConfig = await getSessionMessageConfig(
        server, sysadmin_token, character.id
      );
      expect(characterSessionConfig).toEqual(config);

      await updateSessionSettings(
        server, token, session.id,
        { auto_picture: false }
      );
      const updatedSession = await getSession(server, token, session.id);
      expect(updatedSession.settings).toHaveProperty('auto_picture', false);
      const disableAutoImageGen = await sendSessionMessage(
        server, token, session.id,
        'Generate an image for me.'
      );
      isChatReply(disableAutoImageGen);
      expect(disableAutoImageGen).toHaveProperty('type', 'text');
      expect(disableAutoImageGen).toHaveProperty('content', 'This is a test reply from AI.');
      expect(disableAutoImageGen).toHaveProperty('reply_picture_url', null);

      await updateSessionSettings(server, token, session.id, {
        auto_picture: true
      });
      const autoImageGen = await sendSessionMessage(
        server, token, session.id,
        'Generate an image for me.'
      );
      isChatReply(autoImageGen);
      expect(autoImageGen).toHaveProperty('type', 'image');
      expect(autoImageGen).toHaveProperty('content', 'This is a test reply from AI.');
      expect(autoImageGen).toHaveProperty('reply_picture_url', expect.stringContaining(image_gen_url));

      const autoGenImageSession = await getSession(server, token, session.id);
      expect(autoGenImageSession.messages[autoGenImageSession.messages.length - 1])
      .toMatchObject({
        type: 'image',
        content: 'This is a test reply from AI.',
        image_url: expect.stringContaining(image_gen_url)
      });
    }
  );

  test('keyword-based image generation', async ({
    server, token, sysadmin_token, session
  }) => {
    const keyword = 'dancing';
    await updateSessionImageKeywords(server, sysadmin_token, [keyword]);
    const keywords = await listSessionImageKeywords(server, sysadmin_token);
    expect(keywords).toContain(keyword);

    await updateSessionSettings(
      server, token, session.id,
      { auto_picture: false }
    );
    const updatedSession = await getSession(server, token, session.id);
    expect(updatedSession.settings).toHaveProperty('auto_picture', false);
    const messageWithoutKeyword = await sendSessionMessage(
      server, token, session.id,
      `*${keyword}* Create an image for me.`
    );
    isChatReply(messageWithoutKeyword);
    expect(messageWithoutKeyword).toHaveProperty('type', 'image');
    expect(messageWithoutKeyword).toHaveProperty('content', 'This is a test reply from AI.');
    expect(messageWithoutKeyword).toHaveProperty('reply_picture_url', expect.stringContaining(image_gen_url));
  });
});


function isSessionConfig(config) {
  expect(config).toBeInstanceOf(Object);
  expect(config).toHaveProperty('turns', expect.any(Number));
  expect(config).toHaveProperty('probability', expect.any(Number));
}