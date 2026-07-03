import { randomUUID } from 'node:crypto';
import { addDays } from 'date-fns';
import { Payment } from '@errows/models';
import { dbClientWrapper } from '../utils.mjs';

export const command = 'grant-membership <email>';
export const describe = 'Grant membership plan and coins to a user (DB direct)';
export const builder = {
  email: {
    type: 'string',
    describe: 'User email address',
    demandOption: true,
  },
  plan: {
    alias: 'p',
    type: 'string',
    describe: 'Membership plan',
    choices: ['free', 'star', 'luna', 'galaxy'],
    default: 'star',
  },
  duration_days: {
    type: 'number',
    describe: 'Membership duration in days',
    default: 30,
  },
  coin_amount: {
    type: 'number',
    describe: 'Coin amount to grant',
    default: 100,
  },
};

export async function grantMembership(client, args) {
  const { default: config } = await import('config');
  const schema = config.scope;
  const {
    email,
    plan = 'star',
    duration_days = 30,
    coin_amount = 100,
  } = args;

  const duration = Number(duration_days);
  const coins = Number(coin_amount);
  if (Number.isNaN(duration) || duration <= 0) {
    throw new Error('duration_days must be a positive number');
  }
  if (Number.isNaN(coins) || coins < 0) {
    throw new Error('coin_amount must be a non-negative number');
  }

  const { rows: [user] } = await client.query(
    `SELECT u.id, u.name
     FROM "${schema}".users u
     JOIN "${schema}".user_email ue ON ue.uid = u.id
     WHERE ue.email = $1`,
    [email]
  );

  if (!user) {
    throw new Error(`User with email ${email} not found`);
  }

  const uid = user.id;
  const credentialId = randomUUID();
  const subscriptionId = null;
  const validUntil = addDays(new Date(), duration);

  await client.query('BEGIN');
  try {
    // Update membership plan directly (no CD-key)
    if (plan !== 'free') {
      const validFrom = new Date();
      await client.query(
        `WITH close_old_plan AS (
          UPDATE "${schema}".members_plan
          SET stv_tr = TSTZRANGE(LOWER(stv_tr), $7::timestamptz, '[)')
          WHERE id = $1 AND stv_tr @> $7::timestamptz
          RETURNING id
        )
        INSERT INTO "${schema}".members_plan (
          id, plan, plan_type, credential_id, subscription_id, stv_tr
        )
        SELECT $1, $2, $3, $4, $5, TSTZRANGE($7::timestamptz, $6::timestamptz, '[)')
        FROM (VALUES (1)) AS dummy
        LEFT JOIN close_old_plan ON TRUE
        RETURNING id`,
        [uid, plan, 'manual', credentialId, subscriptionId, validUntil, validFrom]
      );
    }

    // Grant purchased coins directly with a manual reason
    if (coins > 0) {
      await Payment.addCoinTransaction(
        client, schema, uid,
        credentialId, coins,
        'manual_grant'
      );
      await client.query(
        `INSERT INTO "${schema}".members_coins (type, uid, amount, stv_tr)
         VALUES ('purchased', $1, $2, TSTZRANGE(NOW(), 'infinity'::timestamptz, '[)'))`,
        [uid, coins]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }

  console.log('✅ Membership granted');
  console.log(`User: ${user.name} (${uid})`);
  console.log(`Plan: ${plan}`);
  console.log(`Duration: ${duration} days`);
  console.log(`Coins granted: ${coins}`);
}

export const handler = dbClientWrapper(grantMembership);
