import { beforeEach, describe, expect, onTestFinished, vi } from "vitest";
import { default as config } from 'config';
import {
  test,
  upsertCoinProducts,
  listCoinProducts,
  listSubscriptionProducts,
  checkPurchaseStatus,
  checkoutCoinProduct,
  checkoutSubscriptionProduct,
  stripeWebhook
} from "./fixtures/payment.mjs";
import { getMemberInfo } from './fixtures/user.mjs';
import stripe from '../services/libs/stripe.mjs';
import { randomUUID } from "crypto";
import { methods as pixelMethods } from '../services/libs/pixel.mjs';
import { waitingExpectToBeTrue } from "./lib/utils.mjs";
import { addMonths, isSameDay,  } from "date-fns";

const pixelTrackSpy = vi.spyOn(pixelMethods, 'pixelTrack');


const scope = 'payment_tests';
test.scoped({ scope, services: ['api', 'user', 'ops', 'payment'] });

beforeEach(() => {
  pixelTrackSpy.mockReset();
  pixelTrackSpy.mockResolvedValue();
});

describe('coins', () => {
  test('coins products', async ({ server, sysadmin_token, token }) => {
    await upsertCoinProducts(server, sysadmin_token);
    const coinsProducts = await listCoinProducts(server, token);
    expect(coinsProducts).toBeInstanceOf(Array);
    coinsProducts.forEach(isCoinProduct);
  });

  test('checkout coins product', async ({
    server, token, user,
    coins_products, banding_pixel
  }) => {
    expect(pixelMethods.pixelTrack).toBeCalledTimes(1);
    const product = coins_products[0];
    expect(product.amount).toBeGreaterThan(0);

    const sessionId = 'test_session_id_for_checkout_coin';
    const checkout_url = `https://checkout.stripe.com/pay/${sessionId}`;
    const sessionSpy = vi.spyOn(stripe.checkout.sessions, 'create')
    .mockResolvedValue({
      id: sessionId,
      object: 'checkout.session',
      url: checkout_url,
    });
    onTestFinished(() => sessionSpy.mockRestore());

    const ip = '192.168.1.1';
    const referrer = 'https://example.com/checkout-page';
    const userAgent = 'test-user-agent-string';
    const res = await checkoutCoinProduct(
      server, token, product.id,
      {
        referer: referrer,
        'user-agent': userAgent,
        'x-forwarded-for': ip,
      }
    );

    expect(res).toHaveProperty('id', expect.any(String));
    expect(res).toHaveProperty('session_id', sessionId);
    expect(res).toHaveProperty('checkout_url', checkout_url);

    expect(sessionSpy).toHaveBeenCalledTimes(1);
    expect(sessionSpy).toHaveBeenCalledWith(expect.objectContaining({
      customer_email: user.email,
      mode: 'payment',
      line_items: [
        {
          price: product.price_id,
          quantity: 1,
        }
      ],
    }));

    const { id: payment_id } = res;
    const { id: pixel_id, access_token } = banding_pixel;
    await waitingExpectToBeTrue(
      () => null,
      () => {
        expect(pixelMethods.pixelTrack).toBeCalledTimes(2);
      }
    );
    expect(pixelMethods.pixelTrack).toHaveBeenLastCalledWith(
      pixel_id, access_token,
      [
        {
          event_name: 'InitiateCheckout',
          event_time: expect.any(Number),
          event_id: `checkout.${payment_id}`,
          user_data: expect.objectContaining({
            external_id: user.id,
            client_ip_address: ip,
            client_user_agent: userAgent
          }),
          event_source_url: referrer,
          action_source: 'website',
          custom_data: expect.objectContaining({
            currency: product.currency,
            value: product.price,
            content_ids: [
              product.id,
              product.price_id
            ],
            content_type: product.type,
            product_name: product.name,
          })
        }
      ]
    );
  });

  describe('purchase', () => {
    test(
      'purchase success',
      async ({
        server, token, coins_products, coin_checkout,
        banding_pixel
      }) => {
        expect(pixelMethods.pixelTrack).toBeCalledTimes(1);
        const product = coins_products[0];
        expect(product.amount).toBeGreaterThan(0);

        const beforeMember = await getMemberInfo(server, token);
        isMember(beforeMember);
        expect(beforeMember.coin_purchased_balance).toEqual(0);

        const { id: payment_id, session_id } = coin_checkout;

        const constructEventSpy = vi
        .spyOn(stripe.webhooks, 'constructEvent').mockReturnValue();
        onTestFinished(() => constructEventSpy.mockRestore());

        const eventPayload = {
          id: randomUUID(),
          object: 'event',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: session_id,
              amount_total: 100,
              presentment_details: {
                presentment_amount: 163,
                presentment_currency: "jpy"
              },
            }
          }
        };

        await stripeWebhook(server, 'test_stripe_signature', eventPayload);

        expect(constructEventSpy).toHaveBeenCalledWith(
          Buffer.from(JSON.stringify(eventPayload)),
          'test_stripe_signature',
          config.stripe.webhookSecret
        );

        const paymentStatus = await checkPurchaseStatus(server, token, payment_id);
        isPurchaseStatus(paymentStatus);
        expect(paymentStatus.status).toBe('succeeded');

        const afterMember = await getMemberInfo(server, token);
        isMember(afterMember);
        expect(afterMember.coin_purchased_balance).toEqual(
          beforeMember.coin_purchased_balance + product.amount
        );
        expect(afterMember.plan).toEqual(beforeMember.plan);
        expect(afterMember.plan_type).toEqual(null);
        expect(afterMember.credential_id).toEqual(null);

        // duplicate callback should be ok
        await stripeWebhook(server, 'test_stripe_signature', eventPayload);
        const memberAfterDuplicateCB = await getMemberInfo(server, token);
        expect(memberAfterDuplicateCB.coin_purchased_balance).toEqual(
          afterMember.coin_purchased_balance
        );

        const { id: pixel_id, access_token } = banding_pixel;
        expect(pixelMethods.pixelTrack).toBeCalledTimes(3);
        expect(pixelMethods.pixelTrack).toHaveBeenLastCalledWith(
          pixel_id, access_token,
          [
            {
              event_name: 'Purchase',
              event_time: expect.any(Number),
              event_id: `purchase.${payment_id}`,
              user_data: expect.objectContaining({
                external_id: beforeMember.id
              }),
              custom_data: expect.objectContaining({
                currency: eventPayload.data.object.presentment_details.presentment_currency,
                value: eventPayload.data.object.presentment_details.presentment_amount,
                content_ids: [
                  product.id,
                  product.price_id
                ],
                content_type: product.type,
                amount_total: eventPayload.data.object.amount_total,
                product_name: product.name,
              })
            }
          ]
        );
      }
    );

    test('purchase pending', async ({
      server, token, coins_products, coin_checkout
    }) => {
      const product = coins_products[0];
      expect(product.amount).toBeGreaterThan(0);

      const beforeMember = await getMemberInfo(server, token);
      isMember(beforeMember);
      expect(beforeMember.coin_purchased_balance).toEqual(0);

      const { id: payment_id, session_id } = coin_checkout;

      const constructEventSpy = vi
      .spyOn(stripe.webhooks, 'constructEvent').mockReturnValue();
      onTestFinished(() => constructEventSpy.mockRestore());

      const eventPayload = {
        id: randomUUID(),
        object: 'event',
        type: 'payment_intent.processing',
        data: { object: { id: session_id } }
      };

      await stripeWebhook(server, 'test_stripe_signature', eventPayload);

      expect(constructEventSpy).toHaveBeenCalledWith(
        Buffer.from(JSON.stringify(eventPayload)),
        'test_stripe_signature',
        config.stripe.webhookSecret
      );

      const paymentStatus = await checkPurchaseStatus(server, token, payment_id);
      isPurchaseStatus(paymentStatus);
      expect(paymentStatus.status).toBe('pending');

      const afterMember = await getMemberInfo(server, token);
      isMember(afterMember);
      expect(afterMember.coin_purchased_balance).toEqual(
        beforeMember.coin_purchased_balance
      );

      // duplicate callback should be ok
      await stripeWebhook(server, 'test_stripe_signature', eventPayload);
      const memberAfterDuplicateCB = await getMemberInfo(server, token);
      expect(memberAfterDuplicateCB.coin_purchased_balance).toEqual(
        afterMember.coin_purchased_balance
      );
    });

    test('purchase failure', async ({
      server, token, coins_products, coin_checkout
    }) => {
      const product = coins_products[0];
      expect(product.amount).toBeGreaterThan(0);

      const beforeMember = await getMemberInfo(server, token);
      isMember(beforeMember);
      expect(beforeMember.coin_purchased_balance).toEqual(0);

      const { id: payment_id, session_id } = coin_checkout;

      const constructEventSpy = vi
      .spyOn(stripe.webhooks, 'constructEvent').mockReturnValue();
      onTestFinished(() => constructEventSpy.mockRestore());

      const eventPayload = {
        id: randomUUID(),
        object: 'event',
        type: 'checkout.session.async_payment_failed',
        data: { object: { id: session_id } }
      };

      await stripeWebhook(server, 'test_stripe_signature', eventPayload);

      expect(constructEventSpy).toHaveBeenCalledWith(
        Buffer.from(JSON.stringify(eventPayload)),
        'test_stripe_signature',
        config.stripe.webhookSecret
      );

      const paymentStatus = await checkPurchaseStatus(server, token, payment_id);
      isPurchaseStatus(paymentStatus);
      expect(paymentStatus.status).toBe('failed');

      const afterMember = await getMemberInfo(server, token);
      isMember(afterMember);
      expect(afterMember.coin_purchased_balance).toEqual(
        beforeMember.coin_purchased_balance
      );

      // duplicate callback should be ok
      await stripeWebhook(server, 'test_stripe_signature', eventPayload);
      const memberAfterDuplicateCB = await getMemberInfo(server, token);
      expect(memberAfterDuplicateCB.coin_purchased_balance).toEqual(
        afterMember.coin_purchased_balance
      );
    });
  });
});

describe('subscriptions', () => {
  test(
    'list subscription products',
    async ({ server, token, subscription_products }) => {
      const subscriptionProducts = await listSubscriptionProducts(server, token);
      expect(subscriptionProducts).toBeInstanceOf(Array);
      subscriptionProducts.forEach(isSubscriptionProduct);
      expect(subscriptionProducts.length).toEqual(subscription_products.count);
    }
  );

  test('checkout', async ({
    server, token, user,
    subscription_products, banding_pixel
  }) => {
    const product = subscription_products.star_monthly;

    const sessionId = 'test_session_id_for_checkout_subscription';
    const checkout_url = `https://checkout.stripe.com/pay/${sessionId}`;
    const sessionSpy = vi.spyOn(stripe.checkout.sessions, 'create')
    .mockResolvedValue({
      id: sessionId,
      object: 'checkout.session',
      url: checkout_url,
    });
    onTestFinished(() => sessionSpy.mockRestore());

    const ip = '192.168.1.1';
    const referrer = 'https://example.com/checkout-page';
    const userAgent = 'test-user-agent-string';
    const res = await checkoutSubscriptionProduct(
      server, token, product.id,
      {
        referer: referrer,
        'user-agent': userAgent,
        'x-forwarded-for': ip,
      }
    );
    expect(res).toHaveProperty('id', expect.any(String));
    expect(res).toHaveProperty('session_id', sessionId);
    expect(res).toHaveProperty('checkout_url', checkout_url);

    expect(sessionSpy).toHaveBeenCalledTimes(1);
    expect(sessionSpy).toHaveBeenCalledWith(expect.objectContaining({
      customer_email: user.email,
      mode: 'subscription',
      line_items: [
        {
          price: product.price_id,
          quantity: 1,
        }
      ],
    }));

    const { id: payment_id } = res;
    const { id: pixel_id, access_token } = banding_pixel;
    await waitingExpectToBeTrue(
      () => null,
      () => {
        expect(pixelMethods.pixelTrack).toBeCalledTimes(2);
      }
    );
    expect(pixelMethods.pixelTrack).toHaveBeenLastCalledWith(
      pixel_id, access_token,
      [
        {
          event_name: 'InitiateCheckout',
          event_time: expect.any(Number),
          event_id: `checkout.${payment_id}`,
          user_data: expect.objectContaining({
            external_id: user.id,
            client_ip_address: ip,
            client_user_agent: userAgent
          }),
          event_source_url: referrer,
          action_source: 'website',
          custom_data: expect.objectContaining({
            currency: product.currency,
            value: product.price,
            content_ids: [
              product.id,
              product.price_id
            ],
            content_type: product.type,
            product_name: product.name,
          })
        }
      ]
    );
  });

  describe('purchase', () => {
    test(
      'purchase success',
      async ({
        broker, server, token,
        subscription_products, sub_monthly_star_checkout,
        banding_pixel
      }) => {
        const product = subscription_products.star_monthly;
        expect(product.type).toBe('monthly');
        expect(product.name).toBe('star');

        const beforeMember = await getMemberInfo(server, token);
        isMember(beforeMember);
        expect(beforeMember.plan).toBe('free');

        const { id: payment_id, session_id } = sub_monthly_star_checkout;

        const constructEventSpy = vi
        .spyOn(stripe.webhooks, 'constructEvent').mockReturnValue();
        onTestFinished(() => constructEventSpy.mockRestore());

        const eventPayload = {
          id: randomUUID(),
          object: 'event',
          type: 'checkout.session.completed',
          data: { object: {
            id: session_id,
            amount_total: 1900,
            presentment_details: {
              presentment_amount: 3092,
              presentment_currency: "jpy"
            }
          } }
        };

        await stripeWebhook(server, 'test_stripe_signature', eventPayload);

        expect(constructEventSpy).toHaveBeenCalledWith(
          Buffer.from(JSON.stringify(eventPayload)),
          'test_stripe_signature',
          config.stripe.webhookSecret
        );

        const paymentStatus = await checkPurchaseStatus(server, token, payment_id);
        isPurchaseStatus(paymentStatus);
        expect(paymentStatus.status).toBe('succeeded');

        const afterMember = await getMemberInfo(server, token);
        isMember(afterMember);
        expect(afterMember.plan).toEqual('star');
        expect(afterMember.plan_type).toEqual('monthly');
        expect(afterMember.coin_free_balance).toEqual(
          beforeMember.coin_free_balance + product.bonus_coin
        );
        expect(afterMember.coin_purchased_balance).toEqual(
          beforeMember.coin_purchased_balance
        );
        expect(afterMember.credential_id).toEqual(payment_id);
        expect(afterMember.valid_until).toEqual(expect.any(String));
        expect(
          isSameDay(addMonths(Date.now(), 1), new Date(afterMember.valid_until))
        ).toBeTruthy();

        // duplicate callback should be ok
        await stripeWebhook(server, 'test_stripe_signature', eventPayload);
        const memberAfterDuplicateCB = await getMemberInfo(server, token);
        expect(memberAfterDuplicateCB.coin_free_balance).toEqual(afterMember.coin_free_balance);
        expect(memberAfterDuplicateCB.valid_until).toEqual(afterMember.valid_until);

        const transactions = await broker.call(
          'payment.list_coin_transactions',
          { uid: beforeMember.id },
          { meta: { user: { token } } }
        );

        expect(transactions.length).toEqual(2);
        const [paymentTransaction] = transactions;
        expect(paymentTransaction).toHaveProperty('amount', product.bonus_coin);
        expect(paymentTransaction).toHaveProperty('cause_id', payment_id);
        expect(paymentTransaction).toHaveProperty('reason', 'subscription_bonus');

        const { id: pixel_id, access_token } = banding_pixel;
        expect(pixelMethods.pixelTrack).toBeCalledTimes(3);
        expect(pixelMethods.pixelTrack).toHaveBeenLastCalledWith(
          pixel_id, access_token,
          [
            {
              event_name: 'Purchase',
              event_time: expect.any(Number),
              event_id: `purchase.${payment_id}`,
              user_data: expect.objectContaining({
                external_id: beforeMember.id
              }),
              custom_data: expect.objectContaining({
                currency: eventPayload.data.object.presentment_details.presentment_currency,
                value: eventPayload.data.object.presentment_details.presentment_amount,
                content_ids: [
                  product.id,
                  product.price_id
                ],
                content_type: product.type,
                amount_total: eventPayload.data.object.amount_total,
                product_name: product.name,
              })
            }
          ]
        );
      }
    );

    test(
      'purchase pending',
      async ({
        server, token,
        subscription_products, sub_monthly_star_checkout
      }) => {
        const product = subscription_products.star_monthly;
        expect(product.type).toBe('monthly');
        expect(product.name).toBe('star');

        const beforeMember = await getMemberInfo(server, token);
        isMember(beforeMember);
        expect(beforeMember.plan).toBe('free');

        const { id: payment_id, session_id } = sub_monthly_star_checkout;

        const constructEventSpy = vi
        .spyOn(stripe.webhooks, 'constructEvent').mockReturnValue();
        onTestFinished(() => constructEventSpy.mockRestore());

        const eventPayload = {
          id: randomUUID(),
          object: 'event',
          type: 'payment_intent.processing',
          data: { object: { id: session_id } }
        };

        await stripeWebhook(server, 'test_stripe_signature', eventPayload);

        expect(constructEventSpy).toHaveBeenCalledWith(
          Buffer.from(JSON.stringify(eventPayload)),
          'test_stripe_signature',
          config.stripe.webhookSecret
        );

        const paymentStatus = await checkPurchaseStatus(server, token, payment_id);
        isPurchaseStatus(paymentStatus);
        expect(paymentStatus.status).toBe('pending');

        const afterMember = await getMemberInfo(server, token);
        isMember(afterMember);
        expect(afterMember.plan).toBe('free');

        // duplicate callback should be ok
        await stripeWebhook(server, 'test_stripe_signature', eventPayload);
        const memberAfterDuplicateCB = await getMemberInfo(server, token);
        expect(memberAfterDuplicateCB.plan).toBe('free');
      }
    );

    test(
      'purchase failure',
      async ({
        server, token,
        subscription_products, sub_monthly_star_checkout
      }) => {
        const product = subscription_products.star_monthly;
        expect(product.type).toBe('monthly');
        expect(product.name).toBe('star');

        const beforeMember = await getMemberInfo(server, token);
        isMember(beforeMember);
        expect(beforeMember.plan).toBe('free');

        const { id: payment_id, session_id } = sub_monthly_star_checkout;

        const constructEventSpy = vi
        .spyOn(stripe.webhooks, 'constructEvent').mockReturnValue();
        onTestFinished(() => constructEventSpy.mockRestore());

        const eventPayload = {
          id: randomUUID(),
          object: 'event',
          type: 'checkout.session.async_payment_failed',
          data: { object: { id: session_id } }
        };

        await stripeWebhook(server, 'test_stripe_signature', eventPayload);

        expect(constructEventSpy).toHaveBeenCalledWith(
          Buffer.from(JSON.stringify(eventPayload)),
          'test_stripe_signature',
          config.stripe.webhookSecret
        );

        const paymentStatus = await checkPurchaseStatus(server, token, payment_id);
        isPurchaseStatus(paymentStatus);
        expect(paymentStatus.status).toBe('failed');

        const afterMember = await getMemberInfo(server, token);
        isMember(afterMember);
        expect(afterMember.plan).toBe('free');

        // duplicate callback should be ok
        await stripeWebhook(server, 'test_stripe_signature', eventPayload);
        const memberAfterDuplicateCB = await getMemberInfo(server, token);
        expect(memberAfterDuplicateCB.plan).toBe('free');
      }
    );
  });

  describe('upgrade', () => {
    test('upgrade coins product', async ({
      server, token, user,
      subscription_products,
      sub_monthly_star_purchase
    }) => {
      expect(sub_monthly_star_purchase.status).toBeDefined();
      const member = await getMemberInfo(server, token);
      expect(member.plan).toBe('star');
      expect(member.plan_type).toBe('monthly');

      const product = subscription_products.luna_yearly;

      const sessionId = 'test_session_id_for_upgrade_subscription';
      const checkout_url = `https://checkout.stripe.com/pay/${sessionId}`;
      const sessionSpy = vi.spyOn(stripe.checkout.sessions, 'create')
      .mockResolvedValue({
        id: sessionId,
        object: 'checkout.session',
        url: checkout_url,
      });
      onTestFinished(() => sessionSpy.mockRestore());

      const res = await checkoutSubscriptionProduct(
        server, token, product.id
      );
      expect(res).toHaveProperty('id', expect.any(String));
      expect(res).toHaveProperty('session_id', sessionId);
      expect(res).toHaveProperty('checkout_url', checkout_url);

      expect(sessionSpy).toHaveBeenCalledTimes(1);
      expect(sessionSpy).toHaveBeenCalledWith(expect.objectContaining({
        customer_email: user.email,
        mode: 'subscription',
        line_items: [
          {
            price: product.price_id,
            quantity: 1,
          }
        ],
      }));

      const { id: payment_id, session_id } = res;

      const constructEventSpy = vi
      .spyOn(stripe.webhooks, 'constructEvent').mockReturnValue();
      onTestFinished(() => constructEventSpy.mockRestore());

      const eventPayload = {
        id: randomUUID(),
        object: 'event',
        type: 'checkout.session.completed',
        data: { object: { id: session_id } }
      };

      await stripeWebhook(server, 'test_stripe_signature', eventPayload);

      expect(constructEventSpy).toHaveBeenCalledWith(
        Buffer.from(JSON.stringify(eventPayload)),
        'test_stripe_signature',
        config.stripe.webhookSecret
      );

      const paymentStatus = await checkPurchaseStatus(server, token, payment_id);
      isPurchaseStatus(paymentStatus);
      expect(paymentStatus.status).toBe('succeeded');

      const afterMember = await getMemberInfo(server, token);
      isMember(afterMember);
      expect(afterMember.plan).toEqual('luna');
      expect(afterMember.plan_type).toEqual('yearly');
      expect(afterMember.credential_id).toEqual(payment_id);
      expect(afterMember.valid_until).toEqual(expect.any(String));
      expect(
        isSameDay(
          addMonths(new Date(member.valid_until), 12),
          new Date(afterMember.valid_until)
        )
      ).toBeTruthy();
    });
  });
});


function isCoinProduct(product) {
  expect(product).toHaveProperty('id', expect.any(String));
  expect(product).toHaveProperty('title', expect.any(String));
  expect(product).toHaveProperty('name', expect.toBeOneOf([expect.any(String), null]));
  expect(product).toHaveProperty('amount', expect.any(Number));
  expect(product).toHaveProperty('price_id', expect.any(String));
  expect(product).toHaveProperty('price', expect.any(Number));
  expect(product).toHaveProperty('before_discount_price', expect.any(Number));
}

function isSubscriptionProduct(product) {
  expect(product).toHaveProperty('id', expect.any(String));
  expect(product).toHaveProperty('title', expect.any(String));
  expect(product).toHaveProperty('name', expect.stringMatching(/^(star|luna|galaxy)$/));
  expect(product).toHaveProperty('type', expect.stringMatching(/^(monthly|yearly)$/));

  expect(product).toHaveProperty('price_id', expect.any(String));
  expect(product).toHaveProperty('price', expect.any(Number));
  expect(product).toHaveProperty('discount_rate', expect.any(Number));
  expect(product).toHaveProperty('before_discount_price', expect.any(Number));

  expect(product).toHaveProperty('bonus_coin', expect.any(Number));
  expect(product).toHaveProperty('bonus_date', expect.any(Number));
  expect(product).toHaveProperty('bonus_time', expect.any(Number));

  expect(product).toHaveProperty('value', expect.any(String));
  expect(product).toHaveProperty('rights', expect.any(String));
}

function isPurchaseStatus(status) {
  expect(status).toHaveProperty('id', expect.any(String));
  expect(status).toHaveProperty(
    'status',
    expect.stringMatching(/^(pending|succeeded|failed)$/)
  );
}

function isMember(member) {
  expect(member).toHaveProperty('id', expect.any(String));
  expect(member).toHaveProperty('coin_purchased_balance', expect.any(Number));
  expect(member).toHaveProperty('coin_free_balance', expect.any(Number));
  expect(member).toHaveProperty('plan', expect.stringMatching(/^(free|star|luna|galaxy)$/));
  expect(member).toHaveProperty('plan_type', expect.toBeOneOf(['monthly', 'yearly', 'cd-key', null]));
  expect(member).toHaveProperty(
    'credential_id',
    expect.toBeOneOf([expect.any(String), null])
  );
  if (member.plan !== 'free') {
    expect(member.credential_id).not.toEqual(null);
    expect(member.plan_type).not.toEqual(null);
  }
}