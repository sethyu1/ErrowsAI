import { vi, describe, expect } from "vitest";
import ai from '@errows/ai';
import {
  isChatReply, getSession
} from "./fixtures/session.mjs";
import { getMemberInfo } from "./fixtures/user.mjs";
import {
  test,
  isGift,
  isGiftOps,
  sendSessionGift,
  listGifts,
  createGift,
  updateGift,
} from './fixtures/gift.mjs';
import { isPagination } from "./lib/assert.mjs";


const scope = 'errows_gifts_test';

const avatar_url = '/mock-avatar-for-gift.png';
test.scoped({
  scope, avatar_url,
  services: ['api', 'payment', 'user', 'errows', 'ops'],
});

const image_gen_url = '/mock-image-for-gift.png';
vi.spyOn(ai, 'avatarGen').mockResolvedValue({ url: avatar_url });
vi.spyOn(ai, 'imageGen').mockResolvedValue({ url: image_gen_url });
vi.spyOn(ai, 'chatCompletion').mockResolvedValue({ reply: 'This is a mock reply.' });

describe('gift message in session', () => {
  test('send gift message',
    async ({ server, token, session, gifts, session_gifts }) => {
      const member = await getMemberInfo(server, token);
      expect(member.coin_free_balance).toBeGreaterThan(0);

      expect(gifts.filter(g => g.need_claim).length).toBeGreaterThan(0);
      expect(session_gifts.filter(g => g.need_claim).length).toEqual(0);

      expect(session_gifts).toBeInstanceOf(Array);
      expect(session_gifts.length).toBeGreaterThan(0);
      session_gifts.forEach(gift => isGift(gift));
      const gift = session_gifts[0];
      const res = await sendSessionGift(server, token, session.id, gift.id);
      isChatReply(res);
      expect(ai.chatCompletion).toHaveBeenCalledTimes(1);

      const memberAfterSendGift = await getMemberInfo(server, token);
      expect(memberAfterSendGift.coin_free_balance).toEqual(
        member.coin_free_balance - gift.price
      );

      const newSession = await getSession(server, token, session.id);
      expect(newSession.messages).toHaveLength(3);
      const [, gift_message, replyMessage] = newSession.messages;
      expect(gift_message).toMatchObject({
        id: res.send_message_id,
        role: 'user',
        content: expect.any(String),
        type: 'gift',
        image_url: gift.picture_url
      });

      expect(replyMessage).toMatchObject({
        id: res.reply_message_id,
        role: 'character',
        content: expect.any(String),
        type: 'text',
      });
    });
});

describe('gift management (ops)', () => {
  test('create gift', async ({ server, sysadmin_token }) => {
    const giftData = {
      name: 'Test Gift',
      picture_url: 'https://example.com/test-gift.png',
      price: 50,
      intimacy: 25,
      prompt: 'Thank you for the gift!',
      need_claim: false,
      valid_days: null
    };

    const res = await createGift(server, sysadmin_token, giftData);
    expect(res).toHaveProperty('id', expect.any(String));

    const resList = await listGifts(server, sysadmin_token, 0, 10);
    isPagination(resList);
    resList.data.forEach(gift => isGiftOps(gift));
    expect(resList.data.find(g => g.id === res.id)).toBeDefined();
  });

  test('update gift', async ({ server, sysadmin_token, gifts }) => {
    const giftData = { ...gifts[0] };
    const { id } = giftData;

    // Then update it
    const updatedData = {
      ...giftData,
      name: 'Updated Gift Name',
      price: 40
    };
    await updateGift(server, sysadmin_token, id, updatedData);

    // Verify the update
    const res = await listGifts(server, sysadmin_token, 0, 100);
    const updatedGift = res.data.find(g => g.id === id);
    expect(updatedGift).toMatchObject({
      name: 'Updated Gift Name',
      price: 40
    });
  });
});