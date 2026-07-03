import path from 'node:path';
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { dbClientWrapper } from '../utils.mjs';
import { convert2PositiveInt, formatDate } from './utils.mjs';
import { lookupOldUsers } from './users.mjs';

export const command = 'payment <data_dir>';
export const describe = 'migrate payment data from v1';
export const builder = {
  data_dir: {
    describe: 'Path to v1 data directory',
    type: 'string',
    demandOption: true
  }
};

export const handler = dbClientWrapper(migratePayments);

export async function migratePayments(client, argv) {
  const { verbose = false } = argv;
  const { default: config } = await import('config');
  const schema = config.scope;

  const payment_csv = path.join(argv.data_dir, 'ar_user_plan.csv');
  const parser = parse({ columns: true, delimiter: ',' });
  fs.createReadStream(payment_csv, 'utf-8').pipe(parser);

  const payments = [];
  const userIdsSet = new Set();
  for await (const row of parser) {
    const payment = formatPayment(row);
    const { is_deleted } = payment;
    if (is_deleted) {
      continue;
    }
    userIdsSet.add(payment.old_user_id);
    payments.push(payment);
  }

  const userIdMap = await lookupOldUsers(client, schema, Array.from(userIdsSet));

  for (const payment of payments) {
    const {
      old_user_id,
      plan, plan_type,
      coin_free_balance,
      // coin_purchased_balance,
      valid_until,
      subscription_id,
      created_at,
      // updated_at,
    } = payment;

    const uid = userIdMap.get(old_user_id)?.id ?? null;
    if (uid === null) {
      verbose && console.warn(`user not found for payment migration, old_user_id=${old_user_id}`);
      continue;
    }

    await client.query(
      `WITH coins AS (
        INSERT INTO ${schema}.members_coins
        (type, id, uid, amount, created_at, stv_tr)
        VALUES ('free', $1, $1, $2, $3, TSTZRANGE(NOW(), 'infinity'))
        ON CONFLICT DO NOTHING
        RETURNING uid, amount, created_at
      )
      INSERT INTO ${schema}.members_coin_transactions
      (id, uid, cause_id, amount, reason, created_at)
      SELECT uid, uid, uid, amount, 'v1_migration', created_at
      FROM coins`,
      [uid, coin_free_balance, created_at]
    );

    if (plan === 'free' || plan_type === null) {
      continue;
    }

    await client.query(`
      INSERT INTO ${schema}.members_plan
      (
        id, credential_id, subscription_id,
        plan, plan_type,
        created_at, stv_tr
      )
      VALUES (
        $1, $1, $2,
        $3, $4,
        $5, TSTZRANGE($5, $6)
      )
      ON CONFLICT DO NOTHING
    `,
    [
      uid, subscription_id,
      plan, plan_type,
      created_at, valid_until,
    ]);
  }
}


/**
 * @description ar_user_plan.csv columns:
 * id,user_id,plan_id,plan_json,
 * character_num,coins,chat_cost,generate_cost,voice_cost,total_cost,
 * total_recharge,sys_send,status,
 * start_time,end_time,createtime,
 * updatetime,deletetime,level,
 * is_subscription,subscription_id,
 * coin_arrival_time,coin_gift_count,plan_times_type
 *
 */
function formatPayment(row) {
  const {
    user_id: old_user_id,
    plan_json, subscription_id,
  } = row;

  const is_deleted = row.deletetime !== "";
  const start_time = formatDate(row.start_time);
  const valid_until = formatDate(row.end_time);
  const created_at = formatDate(row.createtime);
  const updated_at = formatDate(row.updatetime);

  const coin_free_balance = convert2PositiveInt(row.coins, 10);

  const { plan, plan_type } = parsePlan(plan_json);
  return {
    old_user_id,
    plan, plan_type,
    is_deleted,
    subscription_id,
    coin_free_balance,
    coin_purchased_balance: 0,
    start_time,
    valid_until,
    created_at,
    updated_at,
  };
}

/**
 *
 * @description Convert v1 plan_json to plan type
 * {"name":"Deluxe","display_name":"Galaxy"}
 * {"name":"Premium","display_name":"Luna"}
 * {"name":"Standard","display_name":"Star"}
 */
function parsePlan(plan_json) {
  if (plan_json === "") {
    return { plan: 'free', plan_type: null };
  }

  let plan = 'free';
  let plan_type = null;
  const planData = JSON.parse(plan_json);

  if (planData.name === 'Deluxe') {
    plan = 'galaxy';
  } else if (planData.name === 'Premium') {
    plan = 'luna';
  } else if (planData.name === 'Standard') {
    plan = 'star';
  } else {
    plan = 'free';
  }

  if (planData.times_type === 3) {
    plan_type = 'yearly';
  } else if (planData.times_type === 1) {
    plan_type = 'monthly';
  } else {
    plan_type = null;
  }

  return { plan, plan_type };
}