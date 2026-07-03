import { expect, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { getJSON, postJSON, putJSON } from "../lib/api.mjs";
import { test as baseTest } from "./pixel.mjs";
import stripe from '../../services/libs/stripe.mjs';
import { getMemberInfo } from './user.mjs';

export const mock_payment_service = {
  name: 'payment',
  actions: {
    coin_balance_init: vi.fn()
    .mockResolvedValue({
      coin_free_balance: 10,
    }),
    deduction_coins_by_action: vi.fn()
    .mockResolvedValue({ id: randomUUID() }),
    refound_by_transition: vi.fn()
    .mockResolvedValue({ id: randomUUID() }),
  }
};

const subscriptions = [
  {
    title: 'Star Monthly Subscription',
    name: 'star',
    type: 'monthly',
    price_id: 'monthly_star_stripe_price_id',
    price: 999,
    discount_rate: 20,
    before_discount_price: 1249,
    bonus_coin: 100,
    bonus_date: 30,
    bonus_time: 10,
    value: 'Basic benefits',
    rights: 'Unlimited messages'
  },
  {
    title: 'luna Monthly Subscription',
    name: 'luna',
    type: 'monthly',
    price_id: 'monthly_luna_stripe_price_id',
    price: 9999,
    discount_rate: 30,
    before_discount_price: 14285,
    bonus_coin: 1200,
    bonus_date: 365,
    bonus_time: 120,
    value: 'Basic benefits',
    rights: 'Unlimited messages'
  },
  {
    title: 'galaxy Monthly Subscription',
    name: 'galaxy',
    type: 'monthly',
    price_id: 'monthly_galaxy_stripe_price_id',
    price: 9999,
    discount_rate: 30,
    before_discount_price: 14285,
    bonus_coin: 1200,
    bonus_date: 365,
    bonus_time: 120,
    value: 'Basic benefits',
    rights: 'Unlimited messages'
  },
  {
    title: 'luna Yearly Subscription',
    name: 'luna',
    type: 'yearly',
    price_id: 'yearly_luna_stripe_price_id',
    price: 9999,
    discount_rate: 30,
    before_discount_price: 14285,
    bonus_coin: 1200,
    bonus_date: 365,
    bonus_time: 120,
    value: 'Basic benefits',
    rights: 'Unlimited messages'
  }
];

const coins = Array.from({ length: 3 }, (_, i) => {
  const amount = (i + 1) * 100;
  return {
    type: 'coins',
    title: `${amount} Coins Pack`,
    amount,
    discount_rate: 0.8,
    price_id: `coins_${amount}_stripe_price_id`,
    price: Math.round(amount * 0.99),
    before_discount_price: Math.round(amount * 1.29)
  };
});

export const test = baseTest.extend({
  coins_products: async ({ server, sysadmin_token, token }, use) => {
    await upsertCoinProducts(server, sysadmin_token, coins);

    const res = await listCoinProducts(server, token);
    await use(res);
  },
  subscription_products: async ({ server, sysadmin_token, token }, use) => {
    for (const type of ['monthly', 'yearly']) {
      const products = subscriptions.filter(p => p.type === type);
      await upsertSubscriptionProducts(server, sysadmin_token, type, products);
    }

    const products = await listSubscriptionProducts(server, token);
    const product_agg = products.reduce((agg, product) => {
      const { type, name } = product;
      const key = `${name}_${type}`;
      agg[key] = product;
      return agg;
    }, { count: products.length });
    await use(product_agg);
  },
  coin_checkout: async ({ server, token, coins_products }, use) => {
    const product = coins_products[0];

    const sessionId = `test_session_id_${randomUUID()}`;
    const checkout_url = `https://checkout.stripe.com/pay/${sessionId}`;
    const sessionSpy = vi.spyOn(stripe.checkout.sessions, 'create')
    .mockResolvedValue({
      id: sessionId,
      object: 'checkout.session',
      url: checkout_url,
    });

    const payment = await checkoutCoinProduct(server, token, product.id);
    sessionSpy.mockRestore();

    await use(payment);
  },
  sub_monthly_star_checkout: async ({ server, token, subscription_products }, use) => {
    const product = subscription_products['star_monthly'];
    const payment = await subscriptionCheckout(server, token, product);
    await use(payment);
  },
  sub_monthly_star_purchase: async (
    { server, token, sub_monthly_star_checkout }, use
  ) => {
    const statusRes = await subscriptionPurchase(
      server, token, sub_monthly_star_checkout
    );
    await use(statusRes);
  },
  member_star_monthly: async (
    { server, token, sub_monthly_star_purchase }, use
  ) => {
    expect(sub_monthly_star_purchase).toBeDefined();

    const member = await getMemberInfo(server, token);
    expect(member.plan).toEqual('star');

    await use(member);
  },
  sub_monthly_luna_checkout: async ({ server, token, subscription_products }, use) => {
    const product = subscription_products['luna_monthly'];
    const payment = await subscriptionCheckout(server, token, product);
    await use(payment);
  },
  sub_monthly_luna_purchase: async (
    { server, token, sub_monthly_luna_checkout }, use
  ) => {
    const statusRes = await subscriptionPurchase(
      server, token, sub_monthly_luna_checkout
    );
    await use(statusRes);
  },
  member_luna_monthly: async (
    { server, token, sub_monthly_luna_purchase }, use
  ) => {
    expect(sub_monthly_luna_purchase).toBeDefined();

    const member = await getMemberInfo(server, token);
    expect(member.plan).toEqual('luna');

    await use(member);
  },
  sub_monthly_galaxy_checkout: async ({ server, token, subscription_products }, use) => {
    const product = subscription_products['galaxy_monthly'];
    const payment = await subscriptionCheckout(server, token, product);
    await use(payment);
  },
  sub_monthly_galaxy_purchase: async (
    { server, token, sub_monthly_galaxy_checkout }, use
  ) => {
    const statusRes = await subscriptionPurchase(
      server, token, sub_monthly_galaxy_checkout
    );
    await use(statusRes);
  },
  member_galaxy_monthly: async (
    { server, token, sub_monthly_galaxy_purchase }, use
  ) => {
    expect(sub_monthly_galaxy_purchase).toBeDefined();

    const member = await getMemberInfo(server, token);
    expect(member.plan).toEqual('galaxy');

    await use(member);
  },
});


export async function upsertCoinProducts(server, token, products = coins) {
  return putJSON(server, '/ops/payment/coins', { token, body: { products } });
}

export async function listCoinProducts(server, token) {
  return getJSON(server, '/payment/coins', { token });
}

export async function upsertSubscriptionProducts(server, token, type, products) {
  return putJSON(
    server, `/ops/payment/subscriptions/${type}`,
    { token, body: { products } }
  );
}

export async function listSubscriptionProducts(server, token) {
  return getJSON(server, '/payment/subscriptions', { token });
}

export async function checkPurchaseStatus(server, token, purchase_id) {
  return getJSON(server, `/payment/${purchase_id}/status`, { token });
}

export function checkoutCoinProduct(server, token, product_id, headers = {}) {
  return postJSON(
    server, `/payment/coins/${product_id}/checkout`,
    { token, headers }
  );
}

export function checkoutSubscriptionProduct(server, token, product_id, headers = {}) {
  return postJSON(
    server, `/payment/subscriptions/${product_id}/checkout`,
    { token, headers }
  );
}

export async function stripeWebhook(server, stripeSignature, body) {
  return postJSON(
    server, `/payment/stripe/webhook`,
    {
      headers: { 'stripe-signature': stripeSignature },
      body
    }
  );
}

async function subscriptionCheckout(server, token, product) {
  const sessionId = `test_session_id_${randomUUID()}`;
  const checkout_url = `https://checkout.stripe.com/pay/${sessionId}`;
  const sessionSpy = vi.spyOn(stripe.checkout.sessions, 'create')
  .mockResolvedValue({
    id: sessionId,
    object: 'checkout.session',
    url: checkout_url,
  });

  const payment = await checkoutSubscriptionProduct(server, token, product.id);
  sessionSpy.mockRestore();
  return payment;
}

async function subscriptionPurchase(server, token, payment) {
  const { id: payment_id, session_id } = payment;

  const eventPayload = {
    id: randomUUID(),
    object: 'event',
    type: 'checkout.session.completed',
    data: { object: { id: session_id } }
  };

  const constructEventSpy = vi.spyOn(stripe.webhooks, 'constructEvent')
  .mockReturnValue();

  await stripeWebhook(server, 'test_stripe_signature', eventPayload);

  constructEventSpy.mockRestore();

  const statusRes = await checkPurchaseStatus(server, token, payment_id);
  expect(statusRes.status).toEqual('succeeded');
  return statusRes;
}