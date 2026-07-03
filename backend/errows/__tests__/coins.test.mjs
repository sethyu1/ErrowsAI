import { randomUUID } from 'node:crypto';
import config from 'config';
import { afterAll, beforeAll, describe, expect, vi } from 'vitest';
import ai from '@errows/ai';
import { createCDKey, cdkeyRedeem, test } from './fixtures/coins.mjs';
import { getMemberInfo } from './fixtures/user.mjs';
import {
  createRandomCharacter, rebuildCharacterAvatar,
  waitingCharacterAvatarGen
} from './fixtures/character.mjs';
import { bind_or_create_google_user } from './fixtures/oauth.mjs';
import {
  getSession, messageTTS,
  requestSessionImage, sendSessionMessage, updateSessionSettings
} from './fixtures/session.mjs';
import {
  genRandomImageGenSettings, characterGenImage, characterGenVideo,
  listCharacterImages, createVideoGenerationTask, getVideoGenerationTask
} from './fixtures/media.mjs';
import { waitingExpectToBeTrue } from './lib/utils.mjs';
import { mock_ops_service } from './fixtures/ops.mjs';

const scope = 'coin_tests';
const avatar_url = '/avatar-for-payment-tests.webp';
const milliseconds_of_day = 24 * 60 * 60 * 1000;

test.scoped({
  scope, avatar_url,
  services: ['api', 'user', 'errows', 'payment', mock_ops_service]
});

beforeAll(() => {
  vi.spyOn(ai, 'avatarGen').mockResolvedValue({ image_url: avatar_url });
  vi.spyOn(ai, 'imageGen').mockResolvedValue({ image_url: avatar_url });
  vi.spyOn(ai, 'chatCompletion').mockResolvedValue({ reply: 'This is a reply from payment tests.' });
  vi.spyOn(ai, 'tts').mockResolvedValue({ audio_url: '/tts-for-payment-tests.mp3' });
  vi.spyOn(ai, 'createVideoGenTask').mockResolvedValue({ request_id: 'mock_request_id' });
  vi.spyOn(ai, 'waitingVideoTaskComplete').mockResolvedValue({
    video_url: '/video-for-members-tests.mp4',
    result: { status: 'COMPLETED' }
  });
});

describe('coins top up and deduction', () => {
  let memberInitFreeBalanceSpy;
  beforeAll(() => {
    memberInitFreeBalanceSpy = vi.spyOn(config.member, 'coin_free_balance', 'get')
    .mockReturnValue(0);
  });
  afterAll(() => {
    memberInitFreeBalanceSpy.mockRestore();
  });

  test(
    'insufficient free coin balance',
    async ({
      broker, uid, member,
    }) => {
      expect(member.coin_free_balance).toEqual(0);
      expect(member.coin_purchased_balance).toEqual(0);

      await expect(
        broker.call(
          'payment.deduction_coins_by_action',
          { action: 'video_generation', resource_id: randomUUID() },
          { meta: { user: { uid } } }
        )
      ).rejects.toMatchObject({ type: 'INSUFFICIENT_BALANCE' });
    }
  );

  test(
    'consume all coins and fail on extra deduction',
    async ({ broker, server, uid, token, member, price_video }) => {
      expect(member.coin_free_balance).toEqual(0);
      expect(member.coin_purchased_balance).toEqual(0);

      const validFrom = new Date();
      const validTo = new Date(validFrom.getTime() + 24 * 60 * 60 * 1000);
      const cdkey = await createCDKey(
        broker, uid,
        { plan: 'free', valid_from: validFrom.toISOString(), valid_to: validTo.toISOString(), coin_amount: price_video + 1 }
      );
      await cdkeyRedeem(server, token, cdkey.display_key ?? cdkey.key);
      const afterMember = await getMemberInfo(server, token);
      expect(afterMember.coin_free_balance).toEqual(price_video + 1);
      expect(afterMember.coin_purchased_balance).toEqual(0);

      // Deduct coins equal to price_video
      await broker.call(
        'payment.deduction_coins_by_action',
        { action: 'video_generation', resource_id: randomUUID() },
        { meta: { user: { uid } } }
      );

      const afterDeductionMember = await getMemberInfo(server, token);
      expect(afterDeductionMember.coin_free_balance).toEqual(1);
      expect(afterDeductionMember.coin_purchased_balance).toEqual(0);

      // Try to deduct coins again, should fail
      await expect(
        broker.call(
          'payment.deduction_coins_by_action',
          { action: 'video_generation', resource_id: randomUUID() },
          { meta: { user: { uid } } }
        )
      ).rejects.toMatchObject({ type: 'INSUFFICIENT_BALANCE' });
    }
  );

  test('two free coin records deduction', async ({
    broker, server, uid, token, member, price_image
  }) => {
    expect(member.coin_free_balance).toEqual(0);
    expect(member.coin_purchased_balance).toEqual(0);

    const validFrom = new Date();
    const validTo = new Date(validFrom.getTime() + 24 * 60 * 60 * 1000);
    const cdkey1 = await createCDKey(
      broker, uid,
      { plan: 'free', valid_from: validFrom.toISOString(), valid_to: validTo.toISOString(), coin_amount: price_image + 1 }
    );
    await cdkeyRedeem(server, token, cdkey1.display_key ?? cdkey1.key);

    const cdkey2 = await createCDKey(
      broker, uid,
      { plan: 'free', valid_from: validFrom.toISOString(), valid_to: validTo.toISOString(), coin_amount: price_image + 1 }
    );
    await cdkeyRedeem(server, token, cdkey2.display_key ?? cdkey2.key);

    const afterMember = await getMemberInfo(server, token);
    expect(afterMember.coin_free_balance).toEqual(price_image * 2 + 2);
    expect(afterMember.coin_purchased_balance).toEqual(0);

    // Deduct coins equal to price_image * 2
    for (let i = 0; i < 2; i++) {
      await broker.call(
        'payment.deduction_coins_by_action',
        { action: 'image_generation', resource_id: randomUUID() },
        { meta: { user: { uid } } }
      );
    }

    const afterDeductionMember = await getMemberInfo(server, token);
    expect(afterDeductionMember.coin_free_balance).toEqual(2);
    expect(afterDeductionMember.coin_purchased_balance).toEqual(0);

    // Try to deduct coins again, should fail
    await expect(
      broker.call(
        'payment.deduction_coins_by_action',
        { action: 'image_generation', resource_id: randomUUID() },
        { meta: { user: { uid } } }
      )
    ).rejects.toMatchObject({ type: 'INSUFFICIENT_BALANCE' });
  });
});

describe('member plan', () => {
  test('get member info', async ({ server, token }) => {
    const member = await getMemberInfo(server, token);
    isMemberInfo(member);
    expect(member.plan).toBe('free');
    expect(member.coin_free_balance).toEqual(100);
    expect(member.coin_purchased_balance).toEqual(0);
  });

  test('redeem cdkey star plan', async ({ server, token, member, cdkey_star }) => {
    expect(member.plan).toBe('free');
    expect(member.coin_free_balance).toEqual(100);
    expect(member.coin_purchased_balance).toEqual(0);

    const { display_key, key, plan, coin_amount } = cdkey_star;
    const redeemKey = display_key ?? key;
    const res = await cdkeyRedeem(server, token, redeemKey);

    const starMember = await getMemberInfo(server, token);
    isMemberInfo(starMember);
    expect(starMember.plan).toBe(plan);

    expect(starMember.coin_free_balance).toEqual(member.coin_free_balance + (res.benefit_coin_free ?? coin_amount));
    expect(starMember.coin_purchased_balance).toEqual(member.coin_purchased_balance);

    const planEnd = res.plan_end ? new Date(res.plan_end).getTime() : Date.now() + 30 * milliseconds_of_day;
    expect(new Date(starMember.valid_until).getTime())
      .toBeGreaterThanOrEqual(planEnd - 1000)
      .toBeLessThan(planEnd + 1000);
  });

  test('redeem cdkey luna plan', async ({ server, token, member, cdkey_luna }) => {
    expect(member.plan).toBe('free');
    expect(member.coin_free_balance).toEqual(100);
    expect(member.coin_purchased_balance).toEqual(0);

    const { display_key, key, plan, coin_amount } = cdkey_luna;
    const redeemKey = display_key ?? key;
    const res = await cdkeyRedeem(server, token, redeemKey);

    const lunaMember = await getMemberInfo(server, token);
    isMemberInfo(lunaMember);
    expect(lunaMember.plan).toBe(plan);

    expect(lunaMember.coin_free_balance).toEqual(member.coin_free_balance + (res.benefit_coin_free ?? coin_amount));
    expect(lunaMember.coin_purchased_balance).toEqual(member.coin_purchased_balance);

    const planEnd = res.plan_end ? new Date(res.plan_end).getTime() : Date.now() + 90 * milliseconds_of_day;
    expect(new Date(lunaMember.valid_until).getTime())
      .toBeGreaterThanOrEqual(planEnd - 1000)
      .toBeLessThan(planEnd + 1000);
  });

  test('redeem cdkey galaxy plan', async ({ server, token, member, cdkey_galaxy }) => {
    expect(member.plan).toBe('free');
    expect(member.coin_free_balance).toEqual(100);
    expect(member.coin_purchased_balance).toEqual(0);

    const { display_key, key, plan, coin_amount } = cdkey_galaxy;
    const redeemKey = display_key ?? key;
    const res = await cdkeyRedeem(server, token, redeemKey);

    const lunaMember = await getMemberInfo(server, token);
    isMemberInfo(lunaMember);
    expect(lunaMember.plan).toBe(plan);

    expect(lunaMember.coin_free_balance).toEqual(member.coin_free_balance + (res.benefit_coin_free ?? coin_amount));
    expect(lunaMember.coin_purchased_balance).toEqual(member.coin_purchased_balance);

    const planEnd = res.plan_end ? new Date(res.plan_end).getTime() : Date.now() + 180 * milliseconds_of_day;
    expect(new Date(lunaMember.valid_until).getTime())
      .toBeGreaterThanOrEqual(planEnd - 1000)
      .toBeLessThan(planEnd + 1000);
  });

  test(
    'upgrade plan with cdkey',
    async ({ server, token, member, cdkey_star, cdkey_luna }) => {
      expect(member.plan).toBe('free');

      const redeemKeyStar = cdkey_star.display_key ?? cdkey_star.key;
      const starRes = await cdkeyRedeem(server, token, redeemKeyStar);
      const starMember = await getMemberInfo(server, token);
      expect(starMember.plan).toBe('star');
      expect(starMember.coin_free_balance).toEqual(member.coin_free_balance + (starRes.benefit_coin_free ?? starRes.coin_amount ?? 0));
      expect(new Date(starMember.valid_until).getTime())
        .toBeGreaterThanOrEqual(new Date(starRes.plan_end).getTime() - 1000);

      const redeemKeyLuna = cdkey_luna.display_key ?? cdkey_luna.key;
      const lunaRes = await cdkeyRedeem(server, token, redeemKeyLuna);
      const lunaMember = await getMemberInfo(server, token);
      expect(lunaMember.plan).toBe('luna');
      expect(lunaMember.coin_free_balance)
        .toEqual(member.coin_free_balance + (starRes.benefit_coin_free ?? 0) + (lunaRes.benefit_coin_free ?? 0));

      expect(new Date(lunaMember.valid_until).getTime())
        .toBeGreaterThanOrEqual(new Date(lunaRes.plan_end).getTime() - 1000)
        .toBeLessThan(new Date(lunaRes.plan_end).getTime() + 1000);
    }
  );

  test('can not downgrade plan with cdkey', async ({ server, token, member, cdkey_galaxy, cdkey_star }) => {
    expect(member.plan).toBe('free');

    const redeemKeyGalaxy = cdkey_galaxy.display_key ?? cdkey_galaxy.key;
    const galaxyRes = await cdkeyRedeem(server, token, redeemKeyGalaxy);
    const galaxyMember = await getMemberInfo(server, token);
    expect(galaxyMember.plan).toBe('galaxy');
    expect(galaxyMember.coin_free_balance).toEqual(member.coin_free_balance + (galaxyRes.benefit_coin_free ?? galaxyRes.coin_amount ?? 0));
    expect(new Date(galaxyMember.valid_until).getTime())
      .toBeGreaterThanOrEqual(new Date(galaxyRes.plan_end).getTime() - 1000);

    await expect(
      cdkeyRedeem(server, token, cdkey_star.display_key ?? cdkey_star.key)
    ).rejects.toMatchObject({
      status: 400,
      body: {
        message: 'Cannot downgrade member plan from galaxy to star.'
      }
    });

    const stillGalaxyMember = await getMemberInfo(server, token);
    expect(stillGalaxyMember.plan).toBe('galaxy');
    expect(stillGalaxyMember.coin_free_balance).toEqual(galaxyMember.coin_free_balance);
    expect(stillGalaxyMember.valid_until).toEqual(galaxyMember.valid_until);
  });
});

describe('member init coin balance', () => {
  const init_coin_free_balance = 17;
  beforeAll(() => {
    vi.spyOn(config.member, 'coin_free_balance', 'get')
    .mockReturnValue(init_coin_free_balance);
  });

  test(
    'free member init coin balance',
    async ({ broker, member }) => {
      const { id: uid } = member;
      expect(member.coin_free_balance).toEqual(init_coin_free_balance);
      const transactions = await broker.call(
        'payment.list_coin_transactions',
        { uid }
      );

      expect(transactions).toHaveLength(1);
      isTransitionRecord(
        transactions[0],
        {
          uid,
          cause_id: uid,
          amount: init_coin_free_balance,
          reason: 'init_free_member',
        }
      );
    }
  );

  test(
    'oauth member init coin balance',
    async ({ broker, server, email, member }) => {
      const google_user = await bind_or_create_google_user(server, email);
      expect(google_user.id).toEqual(member.id);
      expect(member.coin_free_balance).toEqual(init_coin_free_balance);

      const transactions = await broker.call(
        'payment.list_coin_transactions',
        { uid: member.id }
      );
      expect(transactions).toHaveLength(1);
      isTransitionRecord(
        transactions[0],
        {
          uid: member.id,
          cause_id: member.id,
          amount: init_coin_free_balance,
          reason: 'init_free_member',
        }
      );
    }
  );
});

describe('consume coins', () => {
  const init_coin_free_balance = 27;
  beforeAll(() => {
    vi.spyOn(config.member, 'coin_free_balance', 'get')
    .mockReturnValue(init_coin_free_balance);
  });

  describe('images', () => {
    test(
      'create character',
      async ({
        broker, server, token, uid, member,
        price_image
      }) => {
        expect(member.coin_free_balance).toEqual(init_coin_free_balance);
        expect(member.coin_purchased_balance).toEqual(0);

        const { id: cid } = await createRandomCharacter(server, token);

        const afterMember = await getMemberInfo(server, token);
        isMemberInfo(
          afterMember,
          {
            coin_free_balance: member.coin_free_balance - price_image,
            coin_purchased_balance: member.coin_purchased_balance
          }
        );

        const transactions = await broker.call(
          'payment.list_coin_transactions',
          { uid }
        ).catch(err => {
          console.error(err);
          throw err;
        });

        expect(transactions).toHaveLength(2);
        isTransitionRecord(
          transactions[0],
          {
            uid: member.id,
            cause_id: cid,
            amount: -price_image,
            reason: 'errows.character_create'
          }
        );
      }
    );

    test(
      'rebuild character avatar',
      async ({ broker, server, token, character, member, price_image }) => {
        expect(member.coin_free_balance).toEqual(init_coin_free_balance - price_image);
        expect(member.coin_purchased_balance).toEqual(0);

        const { id } = await rebuildCharacterAvatar(server, token, character.id);

        const afterMember = await getMemberInfo(server, token);
        isMemberInfo(
          afterMember,
          {
            coin_free_balance: member.coin_free_balance - price_image,
            coin_purchased_balance: member.coin_purchased_balance
          }
        );

        const transactions = await broker.call(
          'payment.list_coin_transactions',
          { uid: member.id }
        );

        expect(transactions).toHaveLength(3);
        isTransitionRecord(
          transactions[0],
          {
            cause_id: id,
            uid: member.id,
            amount: -price_image,
            reason: 'errows.character_avatar_gen'
          }
        );
      }
    );

    test(
      'session request image',
      async ({ broker, server, token, session, member, price_image }) => {
        expect(member.coin_free_balance).toEqual(init_coin_free_balance - price_image);
        expect(member.coin_purchased_balance).toEqual(0);

        const {
          reply_picture_id,
        } = await requestSessionImage(server, token, session.id);

        const afterMember = await getMemberInfo(server, token);
        isMemberInfo(
          afterMember,
          {
            coin_free_balance: member.coin_free_balance - price_image,
            coin_purchased_balance: member.coin_purchased_balance
          }
        );

        const transactions = await broker.call(
          'payment.list_coin_transactions',
          { uid: member.id }
        );

        expect(transactions).toHaveLength(3);
        isTransitionRecord(
          transactions[0],
          {
            cause_id: reply_picture_id,
            uid: member.id,
            amount: -price_image,
            reason: 'errows.session_character_image_request'
          }
        );
      }
    );

    test(
      'image generation on character',
      async ({ broker, server, token, character, member, price_image }) => {
        expect(member.coin_free_balance).toEqual(init_coin_free_balance - price_image);
        expect(member.coin_purchased_balance).toEqual(0);

        const image_settings = await genRandomImageGenSettings(
          server, token, character.gender
        );
        const { id: image_id } = await characterGenImage(
          server, token, character.id, image_settings
        );

        const afterMember = await getMemberInfo(server, token);
        isMemberInfo(
          afterMember,
          {
            coin_free_balance: member.coin_free_balance - price_image,
            coin_purchased_balance: member.coin_purchased_balance
          }
        );

        const transactions = await broker.call(
          'payment.list_coin_transactions',
          { uid: member.id }
        );

        expect(transactions).toHaveLength(3);
        isTransitionRecord(
          transactions[0],
          {
            cause_id: image_id,
            uid: member.id,
            amount: -price_image,
            reason: 'errows.character_image_gen_task_create'
          }
        );
      }
    );
  });

  describe('voice', () => {
    test(
      'manual tts',
      async ({ broker, server, token, session, member, price_image, price_tts }) => {
        expect(member.coin_free_balance).toEqual(init_coin_free_balance - price_image);
        expect(member.coin_purchased_balance).toEqual(0);

        const { id: sid, messages: [{ id: mid }] } = session;
        await messageTTS(server, token, sid, mid);

        const afterMember = await getMemberInfo(server, token);
        isMemberInfo(
          afterMember,
          {
            coin_free_balance: member.coin_free_balance - price_tts,
            coin_purchased_balance: member.coin_purchased_balance
          }
        );

        const transactions = await broker.call(
          'payment.list_coin_transactions',
          { uid: member.id }
        );

        expect(transactions).toHaveLength(3);
        isTransitionRecord(
          transactions[0],
          {
            cause_id: mid,
            uid: member.id,
            amount: -price_tts,
            reason: 'errows.session_message_tts'
          }
        );
      }
    );

    test(
      'auto tts',
      async ({ broker, server, token, session, member, price_image, price_tts }) => {
        expect(member.coin_free_balance).toEqual(init_coin_free_balance - price_image);
        expect(member.coin_purchased_balance).toEqual(0);

        const { id: sid } = session;
        await updateSessionSettings(server, token, sid, { auto_tts: true });
        await sendSessionMessage(
          server, token, sid, 'Hello, this is a test message to trigger auto TTS.'
        );

        const sessionAfter = await getSession(server, token, sid);
        const [, , ttsMessage] = sessionAfter.messages;
        expect(ttsMessage).toBeDefined();
        expect(ttsMessage).toHaveProperty('voice_url', expect.any(String));

        const afterMember = await getMemberInfo(server, token);
        isMemberInfo(
          afterMember,
          {
            coin_free_balance: member.coin_free_balance - price_tts,
            coin_purchased_balance: member.coin_purchased_balance
          }
        );

        const transactions = await broker.call(
          'payment.list_coin_transactions',
          { uid: member.id }
        );

        expect(transactions).toHaveLength(3);
        isTransitionRecord(
          transactions[0],
          {
            cause_id: ttsMessage.id,
            uid: member.id,
            amount: -price_tts,
            reason: 'errows.session_text_message'
          }
        );
      }
    );
  });

  describe('video', () => {
    test(
      'character gen video',
      async ({ broker, server, token, character, member, price_image, price_video }) => {
        const { id: cid } = character;
        await waitingCharacterAvatarGen(server, token, cid, avatar_url);

        expect(member.coin_free_balance).toEqual(init_coin_free_balance - price_image);
        expect(member.coin_purchased_balance).toEqual(0);

        const { data: [image] } = await listCharacterImages(server, token, cid);
        expect(image).toBeDefined();
        const { id: aid } = image;

        const { id: video_id } = await characterGenVideo(
          server, token, cid, aid
        );

        const afterMember = await getMemberInfo(server, token);
        isMemberInfo(
          afterMember,
          {
            coin_free_balance: member.coin_free_balance - price_video,
            coin_purchased_balance: member.coin_purchased_balance
          }
        );

        const transactions = await broker.call(
          'payment.list_coin_transactions',
          { uid: member.id }
        );

        expect(transactions).toHaveLength(3);
        isTransitionRecord(
          transactions[0],
          {
            cause_id: video_id,
            uid: member.id,
            amount: -price_video,
            reason: 'errows.character_video_gen_task_create'
          }
        );
      }
    );

    test(
      'gen video failed',
      async ({ broker, server, token, character, member, price_image, price_video }) => {
        ai.createVideoGenTask.mockResolvedValueOnce(
          { request_id: 'mock_will_failed_request_id' }
        );
        ai.waitingVideoTaskComplete.mockRejectedValueOnce(
          new Error('Video generation failed due to insufficient resources.')
        );

        await waitingCharacterAvatarGen(server, token, character.id, avatar_url);

        expect(member.coin_free_balance).toEqual(init_coin_free_balance - price_image);
        expect(member.coin_purchased_balance).toEqual(0);

        const { id: cid } = character;
        const { data: [image] } = await listCharacterImages(server, token, cid);
        expect(image).toBeDefined();
        const { id: aid } = image;

        const { id: tid } = await createVideoGenerationTask(
          server, token, cid, aid
        );

        await waitingExpectToBeTrue(
          () => {},
          () => {
            expect(ai.createVideoGenTask).toHaveBeenCalledTimes(1);
            expect(ai.waitingVideoTaskComplete).toHaveBeenCalledTimes(1);
          }
        );

        await waitingExpectToBeTrue(
          () => getVideoGenerationTask(server, token, cid, tid),
          (task) => {
            expect(task).toHaveProperty('status', 'failed');
          }
        );

        const afterMember = await getMemberInfo(server, token);
        isMemberInfo(
          afterMember,
          {
            coin_free_balance: member.coin_free_balance,
            coin_purchased_balance: member.coin_purchased_balance
          }
        );

        const transactions = await broker.call(
          'payment.list_coin_transactions',
          { uid: member.id }
        );

        expect(transactions).toHaveLength(4);
        expect(transactions[0]).toMatchObject({
          cause_id: tid,
          uid: member.id,
          amount: price_video,
          reason: 'character_video_gen_failed'
        });
      }
    );
  });
});

describe('insufficient balance', () => {
  const init_coin_free_balance = 5;
  beforeAll(() => {
    vi.spyOn(config.member, 'coin_free_balance', 'get')
    .mockReturnValue(init_coin_free_balance);
  });

  test('create character fails', async ({ server, token }) => {
    await expect(
      createRandomCharacter(server, token)
    ).rejects.toMatchObject({
      status: 402,
      body: {
        message: 'Insufficient coin balance.'
      }
    });
  });
});

function isMemberInfo(info, expected = {}) {
  expect(info).toBeDefined();
  expect(info).toHaveProperty('plan', expect.toBeOneOf(['free', 'star', 'luna', 'galaxy']));
  expect(info).toHaveProperty('valid_until', expect.any(String));
  expect(info).toHaveProperty('coin_free_balance', expect.any(Number));
  expect(info).toHaveProperty('coin_purchased_balance', expect.any(Number));

  expect(info).toMatchObject(expected);
}

function isTransitionRecord(record, expected = {}) {
  expect(record).toBeDefined();
  expect(record).toHaveProperty('id', expect.any(String));
  expect(record).toHaveProperty('uid', expect.any(String));
  expect(record).toHaveProperty('amount', expect.any(Number));
  expect(record).toHaveProperty('reason', expect.any(String));
  expect(record).toHaveProperty('cause_id', expect.any(String));
  expect(record).toHaveProperty('created_at', expect.any(Date));

  expect(record).toMatchObject(expected);
}