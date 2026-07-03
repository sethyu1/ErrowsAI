import config from 'config';
import Stripe from 'stripe';

const { apiKey, webhookSecret, webhookSecretFallback } = config.stripe;
const stripe = new Stripe(apiKey);

export default stripe;

export async function createPaymentSession(
  price,
  email,
  options = {}
) {
  const { quantity = 1, success_url } = options;

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [ { price, quantity } ],
    mode: 'payment',
    ui_mode: 'hosted',
    success_url,
    allow_promotion_codes: true,
  });

  return session;
}

export async function createSubscriptionSession(
  price, email,
  options = {}
) {
  const { quantity = 1, success_url } = options;

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [ { price, quantity } ],
    mode: 'subscription',
    ui_mode: 'hosted',
    success_url,
    allow_promotion_codes: true,
  });

  return session;
}


export async function createCustomerPortalSession(customerId, returnUrl) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}

/**
 * Verify Stripe webhook signature. Uses primary `webhookSecret` first
 * (e.g. account 2 / errowsai.space), then optional `webhookSecretFallback`
 * for a second Stripe account (e.g. account 1 / firestai.org) without a second URL.
 *
 * @param {string | Buffer} payload Raw request body (must match what Stripe signed)
 * @param {string | string[] | undefined} sig `Stripe-Signature` header
 * @returns {import('stripe').Stripe.Event}
 */
export function constructEvent(payload, sig) {
  try {
    return stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (primaryErr) {
    if (!webhookSecretFallback) {
      throw primaryErr;
    }
    try {
      return stripe.webhooks.constructEvent(payload, sig, webhookSecretFallback);
    } catch {
      throw primaryErr;
    }
  }
}