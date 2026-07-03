import { randomUUID, randomBytes } from "crypto";
import { Client } from "pg";
import assert from "node:assert";
import { COIN_PRODUCT, SUBSCRIPTION_PRODUCT } from "@errows/types";
import { ModelError } from "./utils.js";
import { MEMBER_PLANS } from "./constrains.js";
import * as Configuration from "./configuration.js";

export class PAYMENT_MODEL_ERROR extends ModelError<
| 'CDKEY_ALREADY_REDEEMED'
| 'MEMBER_NOT_FOUND'
| 'DOWNGRADE_NOT_ALLOWED'
| 'INVALID_DEDUCTION_ACTION'
| 'INSUFFICIENT_BALANCE'
| 'TRANSACTION_NOT_FOUND'
| 'PRODUCT_NOT_FOUND'
| 'PURCHASE_NOT_FOUND'
> {}

interface CDKeyCreateResult {
  id: string;
  key: string;
  display_key: string;
  usage_type: CDKeyUsageType;
  max_redemptions: number | null;
  plan: string;
  coin_amount: number;
  valid_from: string;
  valid_to: string;
  benefit_plan: string | null;
  benefit_plan_start_days: number | null;
  benefit_plan_end_days: number | null;
  benefit_plan_valid_from: string | null;
  benefit_plan_valid_to: string | null;
  benefit_coin_gold: number;
  benefit_coin_free: number;
}
export type CDKeyUsageType = 'one_time' | 'multiple';

const DISPLAY_KEY_MIN_LEN = 8;
const DISPLAY_KEY_MAX_LEN = 30;

interface CDKeyRow {
  id: string;
  key: string;
  display_key: string;
  usage_type: CDKeyUsageType;
  max_redemptions: number | null;
  redemption_count?: number;
  plan: string;
  coin_amount: number;
  created_by: string;
  redeemed_by: string | null;
  redeemed_at: string | null;
  created_at: string;
  valid_from: string;
  valid_to: string;
  benefit_plan: string | null;
  benefit_plan_start_days: number | null;
  benefit_plan_end_days: number | null;
  benefit_plan_valid_from: string | null;
  benefit_plan_valid_to: string | null;
  benefit_coin_gold: number;
  benefit_coin_free: number;
}

/**
 * @description 列出 CD-Key（支持分页与筛选）
 */
export async function listCDKeys(
  client: Client,
  schema: string,
  params: { page?: number; pageSize?: number; plan?: string; redeemed?: boolean; usage_type?: CDKeyUsageType } = {}
): Promise<{ list: CDKeyRow[]; total: number }> {
  const { page = 1, pageSize = 20, plan, redeemed, usage_type } = params;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (plan != null && plan !== "") {
    conditions.push(`plan = $${i++}`);
    values.push(plan);
  }
  if (usage_type === 'one_time' || usage_type === 'multiple') {
    conditions.push(`usage_type = $${i++}`);
    values.push(usage_type);
  }
  if (redeemed === true) {
    conditions.push("redeemed_at IS NOT NULL");
  } else if (redeemed === false) {
    conditions.push("redeemed_at IS NULL");
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const countResult = await client.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ${schema}.cd_keys ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  const whereWithAlias = conditions.length ? `WHERE ${conditions.map(c => c.replace(/^(plan|usage_type|redeemed_at)\b/, "k.$1")).join(" AND ")}` : "";
  values.push(pageSize, offset);
  const { rows } = await client.query<CDKeyRow>(
    `SELECT k.id, k.key, k.display_key, k.usage_type, k.max_redemptions,
       k.plan, k.coin_amount, k.created_by, k.redeemed_by, k.redeemed_at, k.created_at,
       k.valid_from, k.valid_to, k.benefit_plan, k.benefit_plan_start_days, k.benefit_plan_end_days,
       k.benefit_plan_valid_from, k.benefit_plan_valid_to, k.benefit_coin_gold, k.benefit_coin_free,
       (CASE WHEN k.usage_type = 'multiple' THEN (SELECT COUNT(*)::int FROM ${schema}.cd_key_redemptions r WHERE r.cd_key_id = k.id) ELSE (CASE WHEN k.redeemed_at IS NOT NULL THEN 1 ELSE 0 END) END) AS redemption_count
     FROM ${schema}.cd_keys k
     ${whereWithAlias}
     ORDER BY k.created_at DESC
     LIMIT $${i++} OFFSET $${i}`,
    values
  );

  return { list: rows, total };
}

/**
 * @description 删除 CD-Key. One-time: only when not redeemed; multiple: allowed (cascades redemptions).
 */
export async function deleteCDKey(
  client: Client,
  schema: string,
  id: string
): Promise<boolean> {
  const { rowCount } = await client.query(
    `DELETE FROM ${schema}.cd_keys
     WHERE id = $1 AND (usage_type = 'multiple' OR redeemed_at IS NULL)`,
    [id]
  );
  return (rowCount ?? 0) === 1;
}

const DISPLAY_KEY_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Normalize display_key: trim, uppercase, alphanumeric only, max 30 chars */
function normalizeDisplayKey(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
  return s.slice(0, DISPLAY_KEY_MAX_LEN);
}

/** Generate a unique display_key (8 alphanumeric chars by default) */
async function generateUniqueDisplayKey(
  client: Client, schema: string, length = 8, maxAttempts = 10
): Promise<string> {
  const chars = DISPLAY_KEY_CHARS;
  for (let a = 0; a < maxAttempts; a++) {
    let s = '';
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i++) {
      s += chars[bytes[i]! % chars.length];
    }
    const { rows } = await client.query(
      `SELECT 1 FROM ${schema}.cd_keys WHERE display_key = $1`,
      [s]
    );
    if (rows.length === 0) return s;
  }
  throw new Error('Failed to generate unique display_key');
}

// 创建 CD-Key（display_key 可选 8-30 位，否则自动生成 8 位）
export async function createCDKey(
  client: Client, schema: string, uid: string,
  options: {
    key?: string | null;
    display_key?: string | null;
    usage_type?: CDKeyUsageType;
    max_redemptions?: number | null;
    plan?: 'free' | 'star' | 'luna' | 'galaxy';
    coin_amount: number;
    valid_from?: Date;
    valid_to?: Date;
    benefit_plan?: 'free' | 'star' | 'luna' | 'galaxy' | null;
    benefit_plan_start_days?: number | null;
    benefit_plan_end_days?: number | null;
    benefit_plan_valid_from?: Date | null;
    benefit_plan_valid_to?: Date | null;
    benefit_coin_gold?: number;
    benefit_coin_free?: number;
  }
): Promise<CDKeyCreateResult> {
  const id = randomUUID();
  const internalKey = options.key ?? id;
  let displayKey: string;
  if (options.display_key != null && options.display_key.trim() !== '') {
    const normalized = normalizeDisplayKey(options.display_key);
    if (normalized.length < DISPLAY_KEY_MIN_LEN) {
      throw new PAYMENT_MODEL_ERROR('CDKEY_ALREADY_REDEEMED', `display_key must be ${DISPLAY_KEY_MIN_LEN}-${DISPLAY_KEY_MAX_LEN} alphanumeric characters`);
    }
    const { rows } = await client.query(`SELECT 1 FROM ${schema}.cd_keys WHERE display_key = $1`, [normalized]);
    if (rows.length > 0) throw new PAYMENT_MODEL_ERROR('CDKEY_ALREADY_REDEEMED', 'display_key already exists');
    displayKey = normalized;
  } else {
    displayKey = await generateUniqueDisplayKey(client, schema, 8);
  }
  const validFrom = options.valid_from ?? new Date();
  const validTo = options.valid_to ?? new Date(validFrom.getTime() + 365 * 24 * 60 * 60 * 1000);
  const plan = options.plan ?? 'free';
  const usageType = options.usage_type ?? 'one_time';
  const maxRedemptions = usageType === 'multiple' ? (options.max_redemptions ?? 1) : null;
  const benefitPlan = options.benefit_plan ?? plan;
  const benefitPlanStartDays = options.benefit_plan_start_days ?? 0;
  const benefitPlanEndDays = options.benefit_plan_end_days ?? 0;
  const benefitPlanValidFrom = options.benefit_plan_valid_from ?? null;
  const benefitPlanValidTo = options.benefit_plan_valid_to ?? null;
  const benefitCoinGold = options.benefit_coin_gold ?? 0;
  const benefitCoinFree = options.benefit_coin_free ?? options.coin_amount;

  const { rows: [res] } = await client.query<CDKeyCreateResult>(
    `INSERT INTO ${schema}.cd_keys (
      created_by, key, display_key, usage_type, max_redemptions,
      plan, coin_amount,
      valid_from, valid_to,
      benefit_plan, benefit_plan_start_days, benefit_plan_end_days,
      benefit_plan_valid_from, benefit_plan_valid_to,
      benefit_coin_gold, benefit_coin_free
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING id, key, display_key, usage_type, max_redemptions, plan, coin_amount,
      valid_from::text, valid_to::text,
      benefit_plan, benefit_plan_start_days, benefit_plan_end_days,
      benefit_plan_valid_from::text, benefit_plan_valid_to::text,
      benefit_coin_gold, benefit_coin_free`,
    [uid, internalKey, displayKey, usageType, maxRedemptions, plan, options.coin_amount,
      validFrom, validTo,
      benefitPlan, benefitPlanStartDays, benefitPlanEndDays,
      benefitPlanValidFrom, benefitPlanValidTo,
      benefitCoinGold, benefitCoinFree]
  );

  return res!;
}

/**
 * @description 更新 CD-Key（display_key 8-30 位、有效期与权益）. One-time: only when not redeemed; multiple: always.
 */
export async function updateCDKey(
  client: Client, schema: string, id: string,
  updates: {
    display_key?: string | null;
    valid_from?: Date;
    valid_to?: Date;
    benefit_plan?: 'free' | 'star' | 'luna' | 'galaxy' | null;
    benefit_plan_start_days?: number | null;
    benefit_plan_end_days?: number | null;
    benefit_plan_valid_from?: Date | null;
    benefit_plan_valid_to?: Date | null;
    benefit_coin_gold?: number;
    benefit_coin_free?: number;
    max_redemptions?: number | null;
  }
): Promise<boolean> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (updates.display_key !== undefined) {
    const normalized = updates.display_key != null && updates.display_key.trim() !== ''
      ? normalizeDisplayKey(updates.display_key)
      : null;
    if (normalized !== null && normalized.length < DISPLAY_KEY_MIN_LEN) {
      throw new PAYMENT_MODEL_ERROR('CDKEY_ALREADY_REDEEMED', `display_key must be ${DISPLAY_KEY_MIN_LEN}-${DISPLAY_KEY_MAX_LEN} alphanumeric characters`);
    }
    if (normalized !== null) {
      const { rows } = await client.query(`SELECT 1 FROM ${schema}.cd_keys WHERE display_key = $1 AND id != $2`, [normalized, id]);
      if (rows.length > 0) throw new PAYMENT_MODEL_ERROR('CDKEY_ALREADY_REDEEMED', 'display_key already used by another key');
      sets.push(`display_key = $${i++}`);
      values.push(normalized);
    }
  }
  if (updates.valid_from !== undefined) { sets.push(`valid_from = $${i++}`); values.push(updates.valid_from); }
  if (updates.valid_to !== undefined) { sets.push(`valid_to = $${i++}`); values.push(updates.valid_to); }
  if (updates.benefit_plan !== undefined) { sets.push(`benefit_plan = $${i++}`); values.push(updates.benefit_plan); }
  if (updates.benefit_plan_start_days !== undefined) { sets.push(`benefit_plan_start_days = $${i++}`); values.push(updates.benefit_plan_start_days); }
  if (updates.benefit_plan_end_days !== undefined) { sets.push(`benefit_plan_end_days = $${i++}`); values.push(updates.benefit_plan_end_days); }
  if (updates.benefit_plan_valid_from !== undefined) { sets.push(`benefit_plan_valid_from = $${i++}`); values.push(updates.benefit_plan_valid_from); }
  if (updates.benefit_plan_valid_to !== undefined) { sets.push(`benefit_plan_valid_to = $${i++}`); values.push(updates.benefit_plan_valid_to); }
  if (updates.benefit_coin_gold !== undefined) { sets.push(`benefit_coin_gold = $${i++}`); values.push(updates.benefit_coin_gold); }
  if (updates.benefit_coin_free !== undefined) { sets.push(`benefit_coin_free = $${i++}`); values.push(updates.benefit_coin_free); }
  if (updates.max_redemptions !== undefined) { sets.push(`max_redemptions = $${i++}`); values.push(updates.max_redemptions); }
  if (sets.length === 0) return true;
  values.push(id);
  // One-time: only update if not redeemed; multiple: redeemed_at is always NULL so always updatable
  const { rowCount } = await client.query(
    `UPDATE ${schema}.cd_keys SET ${sets.join(', ')} WHERE id = $${i} AND (usage_type = 'multiple' OR redeemed_at IS NULL)`,
    values
  );
  return (rowCount ?? 0) === 1;
}

interface CDKey {
  id: string;
  plan: string;
  coin_amount: number;
  benefit_plan: string | null;
  benefit_plan_start_days: number | null;
  benefit_plan_end_days: number | null;
  benefit_plan_valid_from: string | null;
  benefit_plan_valid_to: string | null;
  benefit_coin_gold: number;
  benefit_coin_free: number;
}

// 兑换 CD-Key（display_key 8-30 位或旧 key UUID）. One-time: mark row redeemed; multiple: insert redemption row.
export async function redeemCDKey(
  client: Client, schema: string, uid: string, keyOrDisplayKey: string
): Promise<CDKey> {
  const now = new Date();
  const trimmed = keyOrDisplayKey.trim();
  const normalized = normalizeDisplayKey(keyOrDisplayKey);
  const byDisplayKey = normalized.length >= DISPLAY_KEY_MIN_LEN ? normalized : '';
  const byKey = trimmed;

  const { rows: [keyRow] } = await client.query<CDKey & { usage_type: string; max_redemptions: number | null }>(
    `SELECT id, plan, coin_amount, benefit_plan, benefit_plan_start_days, benefit_plan_end_days,
       benefit_plan_valid_from, benefit_plan_valid_to, benefit_coin_gold, benefit_coin_free,
       usage_type, max_redemptions
     FROM ${schema}.cd_keys
     WHERE ((length($1::text) >= 8 AND display_key = $1::text) OR key = $2)
       AND valid_from <= $3::timestamptz AND valid_to >= $3::timestamptz`,
    [byDisplayKey, byKey, now]
  );

  if (!keyRow) {
    throw new PAYMENT_MODEL_ERROR(
      'CDKEY_ALREADY_REDEEMED',
      'The CD-Key does not exist or is not valid at this time.'
    );
  }

  if (keyRow.usage_type === 'one_time') {
    const { rows: [res] } = await client.query<CDKey>(
      `UPDATE ${schema}.cd_keys
       SET redeemed_by = $1, redeemed_at = NOW()
       WHERE id = $2 AND redeemed_at IS NULL
       RETURNING id, plan, coin_amount,
         benefit_plan, benefit_plan_start_days, benefit_plan_end_days,
         benefit_plan_valid_from, benefit_plan_valid_to,
         benefit_coin_gold, benefit_coin_free`,
      [uid, keyRow.id]
    );
    if (!res) {
      throw new PAYMENT_MODEL_ERROR(
        'CDKEY_ALREADY_REDEEMED',
        'The CD-Key has already been redeemed.'
      );
    }
    return res;
  }

  // usage_type === 'multiple'
  const { rows: [countRow] } = await client.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ${schema}.cd_key_redemptions WHERE cd_key_id = $1`,
    [keyRow.id]
  );
  const count = parseInt(countRow?.count ?? '0', 10);
  if (count >= (keyRow.max_redemptions ?? 0)) {
    throw new PAYMENT_MODEL_ERROR(
      'CDKEY_ALREADY_REDEEMED',
      'This CD-Key has reached its maximum number of redemptions.'
    );
  }

  const { rows: [existing] } = await client.query(
    `SELECT 1 FROM ${schema}.cd_key_redemptions WHERE cd_key_id = $1 AND uid = $2`,
    [keyRow.id, uid]
  );
  if (existing) {
    throw new PAYMENT_MODEL_ERROR(
      'CDKEY_ALREADY_REDEEMED',
      'You have already redeemed this CD-Key.'
    );
  }

  await client.query(
    `INSERT INTO ${schema}.cd_key_redemptions (cd_key_id, uid) VALUES ($1, $2)`,
    [keyRow.id, uid]
  );

  return {
    id: keyRow.id,
    plan: keyRow.plan,
    coin_amount: keyRow.coin_amount,
    benefit_plan: keyRow.benefit_plan,
    benefit_plan_start_days: keyRow.benefit_plan_start_days,
    benefit_plan_end_days: keyRow.benefit_plan_end_days,
    benefit_plan_valid_from: keyRow.benefit_plan_valid_from,
    benefit_plan_valid_to: keyRow.benefit_plan_valid_to,
    benefit_coin_gold: keyRow.benefit_coin_gold,
    benefit_coin_free: keyRow.benefit_coin_free,
  };
}

// 记录货币交易
export async function addCoinTransaction(
  client: Client, schema: string, uid: string,
   cause_id: string, amount: number, reason: string,
): Promise<{ id: string }> {
  const { rows: [res] } = await client.query<{ id: string }>(
    `INSERT INTO ${schema}.members_coin_transactions (
      uid,
      amount,
      reason,
      cause_id
    ) VALUES ($1, $2, $3, $4)
    RETURNING id`,
    [uid, amount, reason, cause_id]
  );

  return res!;
}

// 充值免费币
export async function topUpFreeCoins(
  client: Client, schema: string, uid: string,
  amount: number,
  valid_from: Date, valid_to: Date | 'infinity',
): Promise<void> {
  assert(valid_from instanceof Date, 'valid_from must be a Date object');
  if (valid_to !== 'infinity') {
    assert(valid_to instanceof Date, 'valid_to must be a Date object or "infinity"');
  }

  await client.query(
    `INSERT INTO "${schema}".members_coins (
      type, uid, amount, stv_tr
    )
    VALUES ('free', $1, $2, TSTZRANGE($3, $4, '[)'))`,
    [uid, amount, valid_from, valid_to]
  );
}

// 升级会员计划
export async function upgradePlanWithCdKey(
  client: Client, schema: string, uid: string,
  plan: 'free' | 'star' | 'luna' | 'galaxy',
  valid_until: Date,
  credential_id: string,
  valid_from?: Date
) {
  if (plan === 'free') {
    return;
  }

  const rangeStart = valid_from ?? new Date();

  const { rows: [member = null] } = await client
  .query<{ plan: string, valid_until: Date }>(
    `SELECT plan, UPPER(stv_tr) AS valid_until
    FROM ${schema}.members_plan
    WHERE id = $1`,
    [uid]
  );

  const old_plan = member?.plan ?? 'free';
  const old_plan_index = MEMBER_PLANS.findIndex(p => p === old_plan);
  const new_plan_index = MEMBER_PLANS.findIndex(p => p === plan);

  if (new_plan_index < old_plan_index) {
    throw new PAYMENT_MODEL_ERROR(
      'DOWNGRADE_NOT_ALLOWED',
      `Cannot downgrade member plan from ${old_plan} to ${plan}.`
    );
  }

  if (member !== null) {
    if ((new Date(member.valid_until).getTime() - valid_until.getTime()) > 0) {
      return;
    }
  }

  await client.query(
    `WITH close_old_plan AS (
      UPDATE ${schema}.members_plan
      SET stv_tr = TSTZRANGE(LOWER(stv_tr), $5::timestamptz, '[)')
      WHERE id = $1 AND stv_tr @> $5::timestamptz
      RETURNING id
    )
    INSERT INTO ${schema}.members_plan (
      id, plan, plan_type, credential_id, stv_tr
    )
    SELECT $1, $2, 'cd-key', $4, TSTZRANGE($5::timestamptz, $3::timestamptz, '[)')
    FROM (VALUES (1)) AS dummy
    LEFT JOIN close_old_plan ON TRUE
    RETURNING id`,
    [uid, plan, valid_until, credential_id, rangeStart]
  );
}


/** Single price entry for model/action cost (coins charged). */
export interface PriceItem {
  action: string;
  amount: number;
  description?: string;
  unit?: string;
}

/** Default prices; used when DB has no config and as seed. voice_call = coins per second. */
const DEFAULT_PRICES: PriceItem[] = [
  { action: 'llm', amount: 0, description: 'Coins per chat message', unit: 'per_request' },
  { action: 'image_generation', amount: 7, description: 'Coins per image generation', unit: 'per_request' },
  { action: 'video_generation', amount: 40, description: 'Coins per video generation', unit: 'per_request' },
  { action: 'voice_call', amount: 1, description: 'Coins per second of voice call', unit: 'per_second' },
  { action: 'speed_up', amount: 10, description: 'Coins per speed up click', unit: 'per_click' },
  { action: 'tts', amount: 2, description: 'Coins per voice generation (TTS)', unit: 'per_request' },
];

const CONFIG_SCOPE = 'payment';
const CONFIG_KEY_PRICES = 'prices';

let cachedPrices: PriceItem[] | null = null;

export function setPriceCache(prices: PriceItem[] | null): void {
  cachedPrices = prices;
}

function getPriceCache(): PriceItem[] {
  return cachedPrices ?? DEFAULT_PRICES;
}

/**
 * @description 列出所有价格信息（内存缓存优先，否则默认值）
 */
export function listPrices(): PriceItem[] {
  return getPriceCache();
}

export function getPriceByAction(action: string): number {
  const price_info = getPriceCache().find(p => p.action === action);

  if (!price_info) {
    throw new PAYMENT_MODEL_ERROR(
      'INVALID_DEDUCTION_ACTION',
      `No price information found for action: ${action}`
    );
  }

  return price_info.amount;
}

/** Allowed action keys for validation. */
const ALLOWED_ACTIONS = new Set(DEFAULT_PRICES.map(p => p.action));

function validatePriceItem(item: unknown): item is PriceItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'action' in item &&
    typeof (item as PriceItem).action === 'string' &&
    'amount' in item &&
    typeof (item as PriceItem).amount === 'number' &&
    (item as PriceItem).amount >= 0 &&
    ALLOWED_ACTIONS.has((item as PriceItem).action)
  );
}

/**
 * Load prices from DB once and set cache. If DB is empty, seeds DEFAULT_PRICES and returns them.
 */
export async function loadPricesOnce(client: Client, schema: string): Promise<PriceItem[]> {
  if (cachedPrices !== null) {
    return getPriceCache();
  }
  const raw = await Configuration.getConfiguration<PriceItem[]>(client, schema, CONFIG_SCOPE, CONFIG_KEY_PRICES);
  if (Array.isArray(raw) && raw.every(validatePriceItem)) {
    cachedPrices = raw.map(p => ({
      action: p.action,
      amount: Math.max(0, Math.floor(p.amount)),
      description: p.description ?? '',
      unit: p.unit ?? DEFAULT_PRICES.find(d => d.action === p.action)?.unit ?? 'per_request',
    }));
    return getPriceCache();
  }
  cachedPrices = [...DEFAULT_PRICES];
  await Configuration.setConfiguration(client, schema, CONFIG_SCOPE, CONFIG_KEY_PRICES, cachedPrices);
  return getPriceCache();
}

/**
 * Save prices to DB and update cache.
 */
export async function savePrices(client: Client, schema: string, prices: PriceItem[]): Promise<PriceItem[]> {
  if (!Array.isArray(prices) || !prices.every(validatePriceItem)) {
    throw new PAYMENT_MODEL_ERROR(
      'INVALID_DEDUCTION_ACTION',
      'Invalid prices: each item must have action (allowed) and amount (non-negative number)'
    );
  }
  const normalized = prices.map(p => ({
    action: p.action,
    amount: Math.max(0, Math.floor(p.amount)),
    description: p.description ?? '',
    unit: p.unit ?? DEFAULT_PRICES.find(d => d.action === p.action)?.unit ?? 'per_request',
  }));
  await Configuration.setConfiguration(client, schema, CONFIG_SCOPE, CONFIG_KEY_PRICES, normalized);
  setPriceCache(normalized);
  return getPriceCache();
}

// 消费货币、先消费 free 币，再消费 purchased 币
export async function deductCoinsByAction(
  client: Client, schema: string, uid: string,
  amount: number, resource_id: string,
  reason: string
): Promise<{ free: number; purchased: number; }> {

  const { rows, rowCount } = await client.query<{ type: string, deducted_amount: number }>(
    `WITH RECURSIVE coins as (
      SELECT
        ROW_NUMBER() OVER (ORDER BY
          CASE type WHEN 'free' THEN 1 WHEN 'purchased' THEN 2 END,
          created_at ASC
        ) as row_number,
        id, type,
        amount, spend_amount,
        created_at
      FROM ${schema}.members_coins
      WHERE uid = $2 AND stv_tr @> NOW() AND amount > spend_amount
    ),
    deducted(id, row_number, spend_amount, deducted_amount, carryover_amount) AS (
      SELECT
        id, row_number,
        LEAST(amount, spend_amount + $1) AS spend_amount,
        LEAST(amount - spend_amount, $1) AS deducted_amount,
        $1 - LEAST(amount - spend_amount, $1) AS carryover_amount
      FROM coins
      WHERE row_number = 1

      UNION ALL

      SELECT
        c.id, c.row_number,
        LEAST(c.amount, c.spend_amount + carryover_amount) AS spend_amount,
        LEAST(c.amount - c.spend_amount, carryover_amount) AS deducted_amount,
        carryover_amount - LEAST(c.amount - c.spend_amount, carryover_amount) AS carryover_amount
      FROM coins c JOIN deducted d ON c.row_number = d.row_number + 1
      WHERE carryover_amount > 0
    )
    UPDATE ${schema}.members_coins mc
      SET spend_amount = d.spend_amount, updated_at = NOW()
    FROM deducted d
    WHERE mc.id = d.id
      AND (SELECT TRUE FROM deducted WHERE carryover_amount = 0 LIMIT 1) IS NOT NULL
    RETURNING
      mc.id, mc.type, mc.amount,
      d.spend_amount, d.carryover_amount, d.deducted_amount`,
    [amount, uid]
  );

  if ((rowCount ?? 0) === 0) {
    throw new PAYMENT_MODEL_ERROR(
      'INSUFFICIENT_BALANCE',
      `Insufficient balance to deduct coins for: ${reason}`,
      { resource_id, reason, amount, uid }
    );
  }

  return rows.reduce<{ free: number; purchased: number; }>(
    (acc, cur) => {
      Object.assign(acc, {
        [cur.type]: (acc[cur.type as keyof typeof acc] ?? 0) + cur.deducted_amount,
      });
      return acc;
    },
    { free: 0, purchased: 0 }
  );
}

export async function refoundByTransition(
  client: Client, schema: string, uid: string,
  transition_id: string,
  resource_id: string,
  reason: string
): Promise<{ id: string }> {
  const { rows: [row = null] } = await client.query<{ amount: number }>(
    `SELECT amount FROM ${schema}.members_coin_transactions
    WHERE id = $1 AND uid = $2`,
    [transition_id, uid]
  );

  if (row === null) {
    throw new PAYMENT_MODEL_ERROR(
      'TRANSACTION_NOT_FOUND',
      `No transaction found with id: ${transition_id} for user: ${uid}`
    );
  }

  const amount = -row.amount;

  const { rows: [res = null] } = await client.query<{ id: string }>(
    `WITH refound AS (
      INSERT INTO ${schema}.members_coins
      (type, uid, amount, stv_tr)
      VALUES
      ('free', $2, $1, TSTZRANGE(NOW(), 'infinity', '[)'))
      RETURNING id
    )
    INSERT INTO ${schema}.members_coin_transactions (
      id, amount, uid,
      reason, cause_id
    )
    SELECT id, $1, $2, $3, $4
    FROM refound
    RETURNING id`,
    [amount, uid, reason, resource_id]
  );

  if (res === null) {
    throw new PAYMENT_MODEL_ERROR(
      'MEMBER_NOT_FOUND',
      `No member found with id: ${uid} to refound coins`
    );
  }

  return res;
}

interface TRANSITION_RECORD {
  id: string;
  uid: string;
  amount: number;
  reason: string;
  cause_id: string;
  created_at: Date;
}
export async function listCoinTransactions(
  client: Client, schema: string, uid: string
): Promise<TRANSITION_RECORD[]> {
  const { rows } = await client.query<TRANSITION_RECORD>(
    `SELECT id, uid, amount, reason, cause_id, created_at
    FROM ${schema}.members_coin_transactions
    WHERE uid = $1
    ORDER BY created_at DESC`,
    [uid]
  );

  return rows;
}

/**
 * @description 更新代币产品列表（使用时序有效性）
 * 先将旧数据的 stv_tr upper 设置为 now，再插入新数据
 */
export async function upsertCoinProducts(
  client: Client, schema: string,
  products: Omit<COIN_PRODUCT, 'id'>[]
): Promise<void> {
  const names = products.map(p => p.name);
  const titles = products.map(p => p.title);
  const amounts = products.map(p => p.amount);
  const discountRates = products.map(p => p.discount_rate);
  const priceIds = products.map(p => p.price_id);
  const prices = products.map(p => p.price);
  const beforeDiscountPrices = products.map(p => p.before_discount_price);

  await client.query(
    `WITH product_data AS (
      SELECT * FROM
      UNNEST(
        $1::TEXT[], $2::TEXT[], $3::INT[], $4::FLOAT[],
        $5::FLOAT[], $6::TEXT[], $7::FLOAT[]
      ) AS t(
       name, title, amount, discount_rate,
       price, price_id, before_discount_price
      )
    ),
    updated AS (
      UPDATE ${schema}.products
      SET stv_tr = TSTZRANGE(LOWER(stv_tr), NOW(), '[)')
      WHERE type = 'coins' AND stv_tr @> NOW()
      RETURNING name
    )
    INSERT INTO ${schema}.products (
      id, name, title,
      price, price_id, amount,
      discount_rate, before_discount_price,
      type
    )
    SELECT
      GEN_RANDOM_UUID(), pd.name, pd.title,
      pd.price, pd.price_id, pd.amount,
      pd.discount_rate, pd.before_discount_price,
      'coins'
    FROM product_data pd
    LEFT JOIN updated USING(name)`,
    [
      names, titles, amounts, discountRates,
      prices, priceIds, beforeDiscountPrices
    ]
  );
}

/**
 * @description 获取当前有效的代币产品列表
 */
export async function listCoinProducts(
  client: Client, schema: string
): Promise<COIN_PRODUCT[]> {
  const { rows } = await client.query<COIN_PRODUCT>(
    `SELECT id, type, name, title, amount, discount_rate,
      price, price_id, before_discount_price
    FROM ${schema}.products
    WHERE type = 'coins'
      AND stv_tr @> NOW()
    ORDER BY amount ASC`
  );

  return rows;
}

/**
 * @description 更新订阅产品列表（使用时序有效性）
 * 先将旧数据的 stv_tr upper 设置为 now，再插入新数据
 */
export async function upsertSubscriptionProducts(
  client: Client, schema: string,
  type: 'monthly' | 'yearly',
  products: Omit<SUBSCRIPTION_PRODUCT, 'id' | 'type'>[]
): Promise<void> {
  if (products.length === 0) return;

  const names = products.map(p => p.name);
  const titles = products.map(p => p.title);
  const prices = products.map(p => p.price);
  const priceIds = products.map(p => p.price_id);
  const discountRates = products.map(p => p.discount_rate);
  const beforeDiscountPrices = products.map(p => p.before_discount_price);
  const bonusCoins = products.map(p => p.bonus_coin);
  const bonusDates = products.map(p => p.bonus_date);
  const bonusTimes = products.map(p => p.bonus_time);
  const values = products.map(p => p.value);
  const rights = products.map(p => p.rights);

  await client.query(
    `WITH product_data AS (
      SELECT * FROM
      UNNEST(
        $1::TEXT[], $2::TEXT[],
        $3::FLOAT[], $4::TEXT[], $5::FLOAT[], $6::FLOAT[],
        $7::INT[], $8::INT[], $9::INT[], $10::TEXT[], $11::TEXT[]
      ) AS t(
        name, title,
        price, price_id, discount_rate, before_discount_price,
        bonus_coin, bonus_date, bonus_time, value, rights
      )
    ),
    updated AS (
      UPDATE ${schema}.products
      SET stv_tr = TSTZRANGE(LOWER(stv_tr), NOW(), '[)')
      WHERE type = $12 AND stv_tr @> NOW()
      RETURNING name
    )
    INSERT INTO ${schema}.products (
      id, name, title, type,
      price_id, price, discount_rate, before_discount_price,
      bonus_coin, bonus_date, bonus_time, value, rights
    )
    SELECT
      GEN_RANDOM_UUID(), pd.name, pd.title, $12,
      pd.price_id, pd.price, pd.discount_rate, pd.before_discount_price,
      pd.bonus_coin, pd.bonus_date, pd.bonus_time,
      pd.value, pd.rights
    FROM product_data pd
    LEFT JOIN updated USING(name)`,
    [
      names, titles,
      prices, priceIds, discountRates, beforeDiscountPrices,
      bonusCoins, bonusDates, bonusTimes, values, rights,
      type
    ]
  );
}

/**
 * @description 获取当前有效的订阅产品列表
 */
export async function listSubscriptionProducts(
  client: Client, schema: string
): Promise<SUBSCRIPTION_PRODUCT[]> {
  const { rows } = await client.query<SUBSCRIPTION_PRODUCT>(
    `SELECT
      id, name, title, type,
      price, price_id, discount_rate, before_discount_price,
      bonus_coin, bonus_date, bonus_time, value, rights
    FROM ${schema}.products
    WHERE type IN ('monthly', 'yearly')
      AND stv_tr @> NOW()
    ORDER BY
      CASE type WHEN 'monthly' THEN 1 WHEN 'yearly' THEN 2 END,
      CASE name WHEN 'star' THEN 1 WHEN 'luna' THEN 2 WHEN 'galaxy' THEN 3 END`
  );

  return rows;
}

/**
 * @description 根据产品 ID 获取代币产品信息
 */
export async function getCoinProductById(
  client: Client, schema: string, pid: string
): Promise<COIN_PRODUCT> {
  const { rows: [res = null] } = await client.query<COIN_PRODUCT>(
    `SELECT
      id, type, name, amount, discount_rate,
      price, price_id, before_discount_price
    FROM ${schema}.products
    WHERE type = 'coins'
      AND stv_tr @> NOW()
      AND id = $1`,
    [pid]
  );

  if (res === null) {
    throw new PAYMENT_MODEL_ERROR(
      'PRODUCT_NOT_FOUND',
      `No coin product found with id: ${pid}`
    );
  }

  return res;
}

export async function getSubscriptionProductById(
  client: Client, schema: string, pid: string
): Promise<SUBSCRIPTION_PRODUCT> {
  const { rows: [res = null] } = await client.query<SUBSCRIPTION_PRODUCT>(
    `SELECT
      id, name, title, type,
      price, price_id, discount_rate, before_discount_price,
      bonus_coin, bonus_date, bonus_time, value, rights
    FROM ${schema}.products
    WHERE type IN ('monthly', 'yearly')
      AND stv_tr @> NOW()
      AND id = $1`,
    [pid]
  );

  if (res === null) {
    throw new PAYMENT_MODEL_ERROR(
      'PRODUCT_NOT_FOUND',
      `No subscription product found with id: ${pid}`
    );
  }

  return res;
}

/**
 * @description 创建购买记录
 */
export async function createPurchase(
  client: Client, schema: string,
  purchase_id: string,
  uid: string,
  product_id: string,
  session_id: string
): Promise<void> {
  await client.query(
    `INSERT INTO ${schema}.purchase (
      id, uid, product_id, session_id, status
    ) VALUES ($1, $2, $3, $4, 'pending')`,
    [purchase_id, uid, product_id, session_id]
  );
}

interface PurchaseStatus {
  id: string;
  status: 'pending' | 'succeeded' | 'failed';
}

/**
 * @description 查询购买状态
 */
export async function getPurchaseStatus(
  client: Client, schema: string,
  purchase_id: string
): Promise<PurchaseStatus> {
  const { rows: [res = null] } = await client.query<PurchaseStatus>(
    `SELECT id, status FROM ${schema}.purchase WHERE id = $1`,
    [purchase_id]
  );

  if (res === null) {
    throw new PAYMENT_MODEL_ERROR(
      'PRODUCT_NOT_FOUND',
      `No purchase found with id: ${purchase_id}`
    );
  }

  return res;
}

/**
 * @description 保存 stripe webhook 回调信息
 */
export async function saveStripeWebhookEvents(
  client: Client, schema: string,
  event: Record<string, unknown>
): Promise<void> {
  await client.query(
    `INSERT INTO ${schema}.stripe_events (event) VALUES ($1)`,
    [JSON.stringify(event)]
  )
}

/**
 * @description 根据 session ID 获取购买信息
 */
interface PurchaseWithProduct {
  id: string;
  uid: string;
  status: 'pending' | 'succeeded' | 'failed';
  product: COIN_PRODUCT | SUBSCRIPTION_PRODUCT;
}
export async function getPurchaseBySessionId(
  client: Client, schema: string,
  session_id: string
): Promise<PurchaseWithProduct> {
  const { rows: [res = null] } = await client.query<
    (COIN_PRODUCT | SUBSCRIPTION_PRODUCT) & {
      id: string;
      uid: string;
      status: 'pending' | 'succeeded' | 'failed';
      product_id: string;
    }
  >(
    `SELECT
      p.id, p.status, p.uid,
      pr.id AS product_id,
      pr.type, pr.name, pr.title, pr.amount,
      pr.price_id, pr.price, pr.discount_rate, pr.before_discount_price,
      pr.bonus_coin, pr.bonus_date, pr.bonus_time,
      pr.value, pr.rights
    FROM ${schema}.purchase p
    JOIN ${schema}.products pr ON p.product_id = pr.id AND pr.stv_tr @> p.created_at
    WHERE p.session_id = $1`,
    [session_id]
  );

  if (res === null) {
    throw new PAYMENT_MODEL_ERROR(
      'PURCHASE_NOT_FOUND',
      `No purchase found with session_id: ${session_id}`
    );
  }

  const { id, status, uid, ...rest } = res;
  const { product_id, ...product_body } = rest;
  const product = { id: product_id, ...product_body };

  return {
    id, status, uid,
    product: product as COIN_PRODUCT | SUBSCRIPTION_PRODUCT,
  };
}


/**
 * @description 更新购买状态
 */
export async function updatePurchaseStatus(
  client: Client, schema: string,
  purchase_id: string,
  status: 'succeeded' | 'failed'
): Promise<boolean> {
  const { rowCount } = await client.query(
    `UPDATE ${schema}.purchase
    SET status = COALESCE($1, status)
    WHERE id = $2 AND status = 'pending'`,
    [status, purchase_id]
  );

  return rowCount === 1;
}

interface PurchaseWithProduct {
  id: string;
  uid: string;
  status: 'pending' | 'succeeded' | 'failed';
  product: COIN_PRODUCT | SUBSCRIPTION_PRODUCT;
}

/**
 * @description 根据购买ID获取购买信息和产品信息
 */
export async function getPurchaseById(
  client: Client, schema: string,
  purchase_id: string
): Promise<PurchaseWithProduct> {
  const { rows: [res = null] } = await client.query<
    (COIN_PRODUCT | SUBSCRIPTION_PRODUCT) & {
      id: string;
      uid: string;
      status: 'pending' | 'succeeded' | 'failed';
    }
  >(
    `SELECT
      p.id, p.status, p.uid,
      pr.type, pr.name, pr.title, pr.amount,
      pr.price, pr.discount_rate, pr.before_discount_price,
      pr.bonus_coin, pr.bonus_date, pr.bonus_time,
      pr.value, pr.rights
    FROM ${schema}.purchase p
    JOIN ${schema}.products pr ON p.product_id = pr.id AND pr.stv_tr @> p.created_at
    WHERE p.id = $1`,
    [purchase_id]
  );

  if (res === null) {
    throw new PAYMENT_MODEL_ERROR(
      'PURCHASE_NOT_FOUND',
      `No purchase found with id: ${purchase_id}`
    );
  }

  const { id, status, uid, ...product } = res;

  return {
    id, status, uid,
    product: product as COIN_PRODUCT | SUBSCRIPTION_PRODUCT,
  };
}


/**
 * @description 代币购买成功处理 - 发放代币并记录交易
 */
export async function topUpGoldCoins(
  client: Client, schema: string, uid: string,
  purchase_id: string, amount: number,
  valid_from: Date = new Date()
): Promise<void> {
  await client.query(
    `WITH transaction AS (
      INSERT INTO ${schema}.members_coin_transactions (
        uid, cause_id, amount, reason
      ) VALUES ($1, $2, $3, 'coin_purchase')
      RETURNING uid
    )
    INSERT INTO ${schema}.members_coins
    (type, uid, amount, stv_tr)
    VALUES
    ('purchased', $1, $3, TSTZRANGE($4, 'infinity', '[)'));`,
    [uid, purchase_id, amount, valid_from]
  );
}

/**
 * @description CD-Key 兑换发放金币（purchased）
 */
export async function topUpGoldCoinsForCdKey(
  client: Client, schema: string, uid: string,
  cdkey_id: string, amount: number,
  reason: string = 'cdkey_redeem'
): Promise<void> {
  if (amount <= 0) return;
  await client.query(
    `WITH transaction AS (
      INSERT INTO ${schema}.members_coin_transactions (
        uid, cause_id, amount, reason
      ) VALUES ($1, $2, $3, $4)
      RETURNING uid
    )
    INSERT INTO ${schema}.members_coins
    (type, uid, amount, stv_tr)
    VALUES
    ('purchased', $1, $3, TSTZRANGE(NOW(), 'infinity', '[)'));`,
    [uid, cdkey_id, amount, reason]
  );
}

/**
 * @description 创建新的订阅计划 - 关闭旧计划并创建新计划记录
 * @param valid_from - 计划生效时间，默认为当前时间（立即生效）
 */
export async function createNewSubscriptionPlan(
  client: Client, schema: string, uid: string,
  purchase_id: string, subscription_id: string,
  plan: string, plan_type: string, valid_until: Date,
  valid_from: Date = new Date()
): Promise<void> {
  await client.query(
    `WITH close_old_plan AS (
      UPDATE ${schema}.members_plan
      SET stv_tr = TSTZRANGE(LOWER(stv_tr), $7::timestamptz, '[)')
      WHERE id = $1 AND stv_tr @> $7::timestamptz
      RETURNING id
    )
    INSERT INTO ${schema}.members_plan (
      id, plan, plan_type, credential_id, subscription_id, stv_tr
    )
    SELECT $1, $2, $3, $4, $5, TSTZRANGE($7::timestamptz, $6::timestamptz, '[)')
    FROM (VALUES (1)) AS dummy
    LEFT JOIN close_old_plan ON TRUE
    RETURNING id`,
    [uid, plan, plan_type, purchase_id, subscription_id, valid_until, valid_from]
  );
}

/**
 * @description 延长订阅计划 - 延长现有会员计划的有效期（用于续费）
 */
export async function extendSubscriptionPlan(
  client: Client, schema: string, uid: string,
  subscription_id: string, new_valid_until: Date
): Promise<void> {
  await client.query(
    `UPDATE ${schema}.members_plan
     SET stv_tr = TSTZRANGE(LOWER(stv_tr), $3::timestamptz, '[')
     WHERE id = $1 AND subscription_id = $2 AND stv_tr @> NOW()`,
    [uid, subscription_id, new_valid_until]
  );
}
