import { expect } from "vitest";
import {
  getJSON, postJSON, putJSON, deleteJSON
} from "../lib/api.mjs";
import { test as baseTest } from './session.mjs';

export const test = baseTest.extend({
  gifts: async ({ server, sysadmin_token }, use) => {
    // Seed some gifts for testing
    const seedGifts = [
      {
        name: 'Rose',
        picture_url: 'gifts/rose.png',
        price: 10,
        intimacy: 5,
        prompt: 'Thank you for the beautiful rose!',
        need_claim: false,
        valid_days: null
      },
      {
        name: 'Chocolate',
        picture_url: 'gifts/chocolate.png',
        price: 20,
        intimacy: 10,
        prompt: 'I love chocolate!',
        need_claim: false,
        valid_days: null
      },
      {
        name: 'Diamond',
        picture_url: 'gifts/diamond.png',
        price: 100,
        intimacy: 50,
        prompt: 'Wow, a diamond! Thank you so much!',
        need_claim: true,
        valid_days: 1
      }
    ];

    // Create seed gifts
    for (const giftData of seedGifts) {
      await createGift(server, sysadmin_token, giftData);
    }

    const res = await listGifts(server, sysadmin_token);
    await use(res.data);

    for (const gift of res.data) {
      await deleteGift(server, sysadmin_token, gift.id);
    }
  },
  session_gifts: async ({ server, token, gifts }, use) => {
    expect(gifts.length).toBeGreaterThan(0);
    const res = await listSessionGifts(server, token);
    await use(res);
  }
});


export async function listSessionGifts(server, token) {
  return getJSON(
    server,
    `/my/sessions/gifts`,
    { token }
  );
}

export async function sendSessionGift(server, token, sid, gift_id) {
  return postJSON(
    server,
    `/my/sessions/${sid}/gifts/${gift_id}`,
    { token }
  );
}

// Ops APIs
export async function listGifts(server, token, page = 0, size = 10) {
  return getJSON(
    server,
    `/ops/gifts?page=${page}&size=${size}`,
    { token }
  );
}

export async function createGift(server, token, giftData) {
  return postJSON(
    server,
    `/ops/gifts`,
    { token, body: giftData }
  );
}

export async function updateGift(server, token, gift_id, giftData) {
  return putJSON(
    server,
    `/ops/gifts/${gift_id}`,
    { token, body: giftData }
  );
}

export async function deleteGift(server, token, gift_id) {
  return deleteJSON(
    server,
    `/ops/gifts/${gift_id}`,
    { token }
  );
}

export function isGift(gift) {
  expect(gift).toHaveProperty('id', expect.any(String));
  expect(gift).toHaveProperty('name', expect.any(String));
  expect(gift).toHaveProperty('picture_url', expect.any(String));
  expect(gift.picture_url).toMatch(/^https?:\/\//);
  expect(gift).toHaveProperty('price', expect.any(Number));
  expect(gift).toHaveProperty('intimacy', expect.any(Number));
}

export function isGiftOps(gift) {
  expect(gift).toHaveProperty('id', expect.any(String));
  expect(gift).toHaveProperty('name', expect.any(String));
  expect(gift).toHaveProperty('picture_url', expect.any(String));
  expect(gift).toHaveProperty('price', expect.any(Number));
  expect(gift).toHaveProperty('intimacy', expect.any(Number));
  expect(gift).toHaveProperty('need_claim', expect.any(Boolean));
  expect(gift).toHaveProperty('valid_days');
}