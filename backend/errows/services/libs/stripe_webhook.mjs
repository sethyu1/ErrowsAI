/**
 * @fileoverview Stripe webhook handler
 * @description Handles invoice.payment_succeeded, customer.subscription.*, checkout.session.*
 * Subscription plans are created/updated only by invoice and subscription events.
 * Checkout.session handles one-time (coins) and only updates purchase status for subscriptions.
 */

import { Member, Payment, PAYMENT_MODEL_ERROR } from '@errows/models';
import { addYears, addMonths } from 'date-fns';
import { payment_transition_reasons } from './constrains.mjs';
import { paymentErrorHandler } from './error.mjs';
import { constructEvent } from './stripe.mjs';
import { Errors } from 'moleculer';
const { MoleculerClientError } = Errors;

/**
 * @param {import('moleculer').Context} ctx
 * @param {{ logger: object, pool: object, buildSchema: () => string }} service
 */
export async function handleStripeWebhook(ctx, service) {
  const { body } = ctx.params;
  const { stripeSignature } = ctx.meta;

  let event;
  try {
    constructEvent(body, stripeSignature);
    event = JSON.parse(body);
  } catch (err) {
    service.logger.error('Stripe webhook signature verification failed:', err);
    throw new MoleculerClientError('Invalid event');
  }

  const schema = service.buildSchema();
  const client = service.pool;
  await Payment.saveStripeWebhookEvents(client, schema, event);

  ctx.$statusCode = 204;

  const event_type = event.type;

  // Handle recurring subscription invoice payments
  if (event_type === 'invoice.payment_succeeded') {
    const invoice = event.data?.object ?? {};
    const subscription_id = invoice.subscription ?? null;
    const invoice_id = invoice.id ?? null;
    const line0 = invoice.lines?.data?.[0];
    const price_id = line0?.price?.id ?? line0?.pricing?.price_details?.price ?? null;
    const period_end = line0?.period?.end ?? null;
    const period_start = line0?.period?.start ?? null;
    const billing_reason = invoice.billing_reason ?? null;

    if (!subscription_id || !price_id || !invoice_id) {
      service.logger.warn(
        'invoice.payment_succeeded missing required fields',
        { subscription_id, price_id, invoice_id }
      );
      return;
    }

    const products = await Payment.listSubscriptionProducts(client, schema);
    const product = products.find(p => p.price_id === price_id);
    if (!product) {
      service.logger.warn(
        'No subscription product found for price_id',
        { price_id }
      );
      return;
    }

    const { type, name, bonus_coin } = product;

    const periodEndDate = period_end ? new Date(period_end * 1000) : new Date();
    const new_valid_until = type === 'yearly'
      ? addYears(periodEndDate, 1)
      : addMonths(periodEndDate, 1);

    if (billing_reason === 'subscription_cycle') {
      const { rows: [planRow = null] } = await client.query(
        `SELECT id FROM ${schema}.members_plan
         WHERE subscription_id = $1 AND stv_tr @> NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [subscription_id]
      );

      if (!planRow) {
        service.logger.error(
          'Renewal payment without existing active plan',
          { subscription_id, invoice_id, billing_reason }
        );
        return;
      }

      const uid = planRow.id;
      await Payment.extendSubscriptionPlan(
        client, schema, uid,
        subscription_id, new_valid_until
      );

      if (bonus_coin > 0) {
        await Payment.topUpGoldCoins(
          client, schema, uid,
          invoice_id, bonus_coin, new Date()
        );
        await Payment.addCoinTransaction(
          client, schema, uid,
          invoice_id, bonus_coin,
          payment_transition_reasons.SUBSCRIPTION_BONUS
        );
      }

    } else if (billing_reason === 'subscription_create') {
      const { rows: [planRow = null] } = await client.query(
        `SELECT id FROM ${schema}.members_plan
         WHERE subscription_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [subscription_id]
      );

      if (planRow) {
        service.logger.info(
          'Plan already exists for subscription_create, skipping duplicate creation',
          { subscription_id, invoice_id, uid: planRow.id }
        );
        return;
      }

      const customer_email = invoice.customer_email ?? invoice.customer_details?.email ?? null;

      if (!customer_email) {
        service.logger.warn(
          'Cannot find customer_email for subscription_create',
          { subscription_id, invoice_id }
        );
        return;
      }

      const { rows: [userRow = null] } = await client.query(
        `SELECT u.id FROM ${schema}.users u
         JOIN ${schema}.user_email ue ON ue.uid = u.id
         WHERE ue.email = $1 LIMIT 1`,
        [customer_email]
      );

      if (!userRow) {
        service.logger.warn(
          'Cannot find user for subscription_create',
          { subscription_id, invoice_id, customer_email }
        );
        return;
      }

      const uid = userRow.id;

      // Membership starts on invoice period start (day invoice is issued), not payment success day
      const planValidFrom = period_start ? new Date(period_start * 1000) : new Date();
      await Payment.createNewSubscriptionPlan(
        client, schema, uid,
        invoice_id, subscription_id,
        name, type, new_valid_until,
        planValidFrom
      );

      if (bonus_coin > 0) {
        const periodStartDate = planValidFrom;
        const months = type === 'yearly' ? 12 : 1;
        for (let i = 0; i < months; i++) {
          const valid_from = addMonths(periodStartDate, i);
          await Payment.topUpGoldCoins(
            client, schema, uid,
            invoice_id, bonus_coin, valid_from
          );
          await Payment.addCoinTransaction(
            client, schema, uid,
            invoice_id, bonus_coin,
            payment_transition_reasons.SUBSCRIPTION_BONUS
          );
        }
      }

      await ctx.call('user.pixel_purchase', {
        payment_id: invoice_id,
        uid,
        event,
        product
      }).catch(err => {
        service.logger.error('Error during pixel purchase tracking for initial subscription:', err);
      });
      await ctx.call('user.reddit_purchase', {
        payment_id: invoice_id,
        uid,
        event,
        product
      }).catch(err => {
        service.logger.error('Error during Reddit purchase tracking for initial subscription:', err);
      });
      await ctx.call('user.magsrv_conversion', { uid }).catch(err => {
        service.logger.error('Error during magsrv conversion tracking for initial subscription:', err);
      });

    } else {
      service.logger.warn(
        'Unknown billing_reason in invoice.payment_succeeded',
        { billing_reason, subscription_id, invoice_id }
      );
      return;
    }

    return;
  }

  // Handle subscription updates (upgrades/downgrades from Stripe portal)
  if (event_type === 'customer.subscription.updated') {
    const subscription = event.data?.object ?? {};
    const subscription_id = subscription.id;
    const status = subscription.status;
    const current_period_end = subscription.current_period_end;
    const price_id = subscription.items?.data?.[0]?.price?.id ?? null;

    if (!subscription_id || !price_id) {
      service.logger.warn(
        'customer.subscription.updated missing required fields',
        { subscription_id, price_id }
      );
      return;
    }

    // Validate current_period_end is present and valid
    if (!current_period_end || typeof current_period_end !== 'number') {
      service.logger.warn(
        'customer.subscription.updated missing or invalid current_period_end',
        { subscription_id, current_period_end, price_id }
      );
      return;
    }

    const { rows: [planRow = null] } = await client.query(
      `SELECT id, credential_id FROM ${schema}.members_plan
       WHERE subscription_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [subscription_id]
    );

    if (!planRow) {
      service.logger.warn(
        'No member plan found for subscription_id in subscription.updated',
        { subscription_id }
      );
      return;
    }

    const uid = planRow.id;
    const credential_id = planRow.credential_id; // UUID; do not pass Stripe subscription_id (sub_xxx)

    const products = await Payment.listSubscriptionProducts(client, schema);
    const product = products.find(p => p.price_id === price_id);

    if (!product) {
      service.logger.warn(
        'No subscription product found for price_id in subscription.updated',
        { price_id, subscription_id }
      );
      return;
    }

    const { name: plan, type: plan_type } = product;

    // Upgrade always starts at next billing cycle (current_period_end), then runs for one period
    const periodEndDate = new Date(current_period_end * 1000);
    const valid_from = periodEndDate;
    const valid_until = plan_type === 'yearly'
      ? addYears(periodEndDate, 1)
      : addMonths(periodEndDate, 1);

    if (status === 'active' || status === 'trialing') {
      await Payment.createNewSubscriptionPlan(
        client, schema, uid,
        credential_id,
        subscription_id,
        plan, plan_type, valid_until,
        valid_from
      );

      service.logger.info(
        'Subscription updated via portal (effective next billing cycle)',
        { uid, subscription_id, plan, plan_type, valid_from, valid_until }
      );
    }

    return;
  }

  // Handle subscription cancellations (from Stripe portal)
  if (event_type === 'customer.subscription.deleted') {
    const subscription = event.data?.object ?? {};
    const subscription_id = subscription.id;
    const current_period_end = subscription.current_period_end;

    if (!subscription_id) {
      service.logger.warn(
        'customer.subscription.deleted missing subscription_id',
        { subscription_id }
      );
      return;
    }

    const { rows: [planRow = null] } = await client.query(
      `SELECT id FROM ${schema}.members_plan
       WHERE subscription_id = $1 AND stv_tr @> NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [subscription_id]
    );

    if (!planRow) {
      service.logger.warn(
        'No active member plan found for subscription_id in subscription.deleted',
        { subscription_id }
      );
      return;
    }

    const uid = planRow.id;

    const cancel_date = current_period_end
      ? new Date(current_period_end * 1000)
      : new Date();

    await client.query(
      `UPDATE ${schema}.members_plan
       SET stv_tr = TSTZRANGE(LOWER(stv_tr), $1, '[)')
       WHERE id = $2 AND subscription_id = $3 AND stv_tr @> NOW()`,
      [cancel_date, uid, subscription_id]
    );

    service.logger.info(
      'Subscription cancelled via portal',
      { uid, subscription_id, cancel_date }
    );

    return;
  }

  // Handle checkout.session
  if (event_type.startsWith('checkout.session')) {
    let checkout_session_status = 'pending';
    if (
      event_type === 'checkout.session.completed'
      || event_type === 'checkout.session.async_payment_succeeded'
    ) {
      checkout_session_status = 'succeeded';
    } else if (
      event_type === 'checkout.session.async_payment_failed'
      || event_type === 'checkout.session.expired'
    ) {
      checkout_session_status = 'failed';
    }
    if (checkout_session_status === 'pending') {
      return;
    }

    const session = event.data?.object ?? {};
    let purchaseProduct;
    try {
      purchaseProduct = await resolvePurchaseForCheckoutSession(
        client, schema, session, event_type, service.logger
      );
    } catch (err) {
      paymentErrorHandler(err);
    }
    if (purchaseProduct === null) {
      return;
    }

    const {
      id: payment_id, status, uid, product
    } = purchaseProduct;

    if (status !== 'pending') {
      return;
    }

    const { type: product_type, amount } = product;

    const subscription_id = session.subscription ?? null;

    const transactionClient = await service.pool.connect();
    try {
      await transactionClient.query('BEGIN');
      if (product_type === 'coins') {
        await handleCoinPurchase(
          transactionClient, schema, uid,
          payment_id, amount,
          checkout_session_status
        );
      } else {
        await handleSubscriptionPurchase(
          transactionClient, schema, uid,
          payment_id, subscription_id,
          product,
          checkout_session_status
        );
      }
      await transactionClient.query('COMMIT');

      if (checkout_session_status === 'succeeded') {
        await ctx.call('user.pixel_purchase', { payment_id, uid, event, product })
          .catch(err => {
            service.logger.error('Error during pixel purchase tracking:', err);
          });
        await ctx.call('user.reddit_purchase', { payment_id, uid, event, product })
          .catch(err => {
            service.logger.error('Error during Reddit purchase tracking:', err);
          });
        if (product_type !== 'coins') {
          await ctx.call('user.magsrv_conversion', { uid }).catch(err => {
            service.logger.error('Error during magsrv conversion tracking:', err);
          });
        }
      }
    } catch (err) {
      await transactionClient.query('ROLLBACK');
      throw err;
    } finally {
      await transactionClient.release();
    }
  }
}

/**
 * Resolve purchase for checkout.session webhooks: `session_id` on row first, then
 * `metadata.purchase_id`. For `checkout.session.expired` and
 * `checkout.session.async_payment_failed`, missing purchase returns null (2xx for Stripe)
 * instead of 500.
 * @param {import('pg').Pool|import('pg').PoolClient} client
 * @param {string} schema
 * @param {Record<string, unknown>} session
 * @param {string} eventType
 * @param {{ warn?: (msg: string) => void }} logger
 * @returns {Promise<import('@errows/models').Payment.PurchaseWithProduct | null>}
 */
async function resolvePurchaseForCheckoutSession(
  client,
  schema,
  session,
  eventType,
  logger
) {
  const session_id = typeof session.id === 'string' ? session.id : '';
  if (!session_id) {
    logger?.warn?.('Stripe checkout.session webhook missing session id');
    return null;
  }

  const tryBySession = async () => {
    try {
      return await Payment.getPurchaseBySessionId(client, schema, session_id);
    } catch (e) {
      if (e instanceof PAYMENT_MODEL_ERROR && e.type === 'PURCHASE_NOT_FOUND') {
        return null;
      }
      throw e;
    }
  };

  let purchase = await tryBySession();
  if (purchase) {
    return purchase;
  }

  const meta = session.metadata && typeof session.metadata === 'object'
    ? session.metadata
    : {};
  const purchaseId = typeof meta.purchase_id === 'string' ? meta.purchase_id : '';
  if (purchaseId.length > 0) {
    try {
      purchase = await Payment.getPurchaseById(client, schema, purchaseId);
    } catch (e) {
      if (e instanceof PAYMENT_MODEL_ERROR && e.type === 'PURCHASE_NOT_FOUND') {
        purchase = null;
      } else {
        throw e;
      }
    }
    if (purchase) {
      return purchase;
    }
  }

  const optionalMissingOk =
    eventType === 'checkout.session.expired'
    || eventType === 'checkout.session.async_payment_failed';

  if (optionalMissingOk) {
    logger?.warn?.(
      `Stripe ${eventType}: no purchase for session ${session_id}${
        purchaseId ? ` (metadata purchase_id=${purchaseId})` : ''
      }`
    );
    return null;
  }

  throw new PAYMENT_MODEL_ERROR(
    'PURCHASE_NOT_FOUND',
    `No purchase found for checkout session ${session_id}`
  );
}

/**
 * Handle one-time coin purchase from checkout.session: grant coins, update purchase status.
 */
async function handleCoinPurchase(
  client,
  schema,
  uid,
  payment_id,
  amount,
  checkout_session_status
) {
  if (checkout_session_status === 'succeeded') {
    await Payment.topUpGoldCoins(
      client, schema, uid, payment_id, amount
    ).then(res => res, paymentErrorHandler);
  }
  await Payment.updatePurchaseStatus(
    client, schema, payment_id,
    checkout_session_status
  );
}

/**
 * Handle subscription purchase from checkout.session: create/update members_plan,
 * update purchase status, grant bonus coins. Uses subscription_id from session (sub_xxx).
 * Skips plan + bonus if plan already exists (e.g. invoice.payment_succeeded ran first).
 */
async function handleSubscriptionPurchase(
  client,
  schema,
  uid,
  payment_id,
  subscription_id,
  product,
  checkout_session_status
) {
  if (checkout_session_status !== 'succeeded') {
    await Payment.updatePurchaseStatus(client, schema, payment_id, 'failed');
    return;
  }

  if (subscription_id) {
    const { rows: [planRow = null] } = await client.query(
      `SELECT id FROM ${schema}.members_plan
       WHERE subscription_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [subscription_id]
    );
    if (planRow) {
      await Payment.updatePurchaseStatus(client, schema, payment_id, 'succeeded');
      return;
    }
  }

  const memberInfo = await Member.info(client, schema, uid);
  const lastValidUntil = memberInfo.plan !== 'free'
    ? memberInfo.valid_until
    : new Date();

  const { type, name, bonus_coin } = product;
  const valid_until = type === 'yearly'
    ? addYears(lastValidUntil, 1)
    : addMonths(lastValidUntil, 1);

  if (subscription_id) {
    await Payment.createNewSubscriptionPlan(
      client, schema, uid,
      payment_id, subscription_id,
      name, type, valid_until
    );
  }

  await Payment.updatePurchaseStatus(client, schema, payment_id, 'succeeded');

  if (bonus_coin === 0) {
    return;
  }

  const months = type === 'yearly' ? 12 : 1;
  for (let i = 0; i < months; i++) {
    const valid_from = addMonths(lastValidUntil, i);
    if (bonus_coin > 0) {
      await Payment.topUpGoldCoins(
        client, schema, uid,
        payment_id, bonus_coin, valid_from
      );
      await Payment.addCoinTransaction(
        client, schema, uid,
        payment_id, bonus_coin,
        payment_transition_reasons.SUBSCRIPTION_BONUS
      );
    }
  }
}
