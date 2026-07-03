import { Client } from "pg";
import { SESSION_GIFT } from "@errows/types";
import { ModelError } from "./utils.js";

export class GIFT_MODEL_ERROR extends ModelError<
| 'GIFT_NOT_FOUND'
> {}

// 获取礼物列表（用户端）
export async function listSessionGifts(
  client: Client, schema: string,
  uid: string
): Promise<SESSION_GIFT[]> {
  const { rows } = await client.query<SESSION_GIFT>(
    `SELECT DISTINCT
      g.id,
      g.name,
      g.picture_url,
      g.price,
      g.intimacy_points as intimacy,
      g.prompt,
      g.need_claim,
      g.valid_days
    FROM "${schema}".gifts g
    LEFT JOIN "${schema}".user_gifts ug
      ON g.id = ug.id
      AND ug.uid = $1
      AND ug.stv_tr @> now()
    WHERE g.need_claim = false OR ug.id IS NOT NULL
    ORDER BY g.price ASC`,
    [uid]
  );

  return rows;
}

// 获取单个礼物
export async function getGift(
  client: Client, schema: string,
  gift_id: string
): Promise<SESSION_GIFT> {
  const { rows: [gift = null] } = await client.query<SESSION_GIFT>(
    `SELECT
      id,
      name,
      picture_url,
      price,
      intimacy_points as intimacy,
      prompt,
      need_claim,
      valid_days
    FROM "${schema}".gifts
    WHERE id = $1`,
    [gift_id]
  );

  if (gift === null) {
    throw new GIFT_MODEL_ERROR('GIFT_NOT_FOUND', 'Gift not found');
  }

  return gift;
}

// 获取礼物列表（管理端）
export async function listGifts(
  client: Client, schema: string,
  page: number, size: number
): Promise<{ count: number; data: SESSION_GIFT[] }> {
  const offset = page * size;

  const { rows: [{ count } = { count: 0 }] } = await client
  .query<{ count: number }>(
    `SELECT COUNT(*) as count FROM "${schema}".gifts`
  );

  const { rows } = await client.query<SESSION_GIFT>(
    `SELECT
      id,
      name,
      picture_url,
      price,
      intimacy_points as intimacy,
      prompt,
      need_claim,
      valid_days
    FROM "${schema}".gifts
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2`,
    [size, offset]
  );

  return { count: parseInt(count as unknown as string), data: rows };
}

// 添加礼物
export async function createGift(
  client: Client, schema: string,
  gift: Omit<SESSION_GIFT, 'id'>
): Promise<{ id: string }> {
  const { name, picture_url, price, intimacy, prompt, need_claim, valid_days } = gift;

  const { rows: [res] } = await client.query<{ id: string }>(
    `INSERT INTO "${schema}".gifts
      (name, picture_url, price, intimacy_points, prompt, need_claim, valid_days)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [name, picture_url, price, intimacy, prompt ?? null, need_claim, valid_days]
  );

  return res as { id: string };
}

// 更新礼物
export async function updateGift(
  client: Client, schema: string,
  gift_id: string,
  gift: Omit<SESSION_GIFT, 'id'>
): Promise<void> {
  const { name, picture_url, price, intimacy, prompt, need_claim, valid_days } = gift;

  const { rowCount } = await client.query(
    `UPDATE "${schema}".gifts
    SET
      name = $1,
      picture_url = $2,
      price = $3,
      intimacy_points = $4,
      prompt = $5,
      need_claim = $6,
      valid_days = $7,
      updated_at = NOW()
    WHERE id = $8`,
    [name, picture_url, price, intimacy, prompt ?? null, need_claim, valid_days, gift_id]
  );

  if (rowCount === 0) {
    throw new GIFT_MODEL_ERROR('GIFT_NOT_FOUND', 'Gift not found');
  }
}

// 删除礼物
export async function deleteGift(
  client: Client, schema: string,
  gift_id: string
): Promise<void> {
  const { rowCount } = await client.query(
    `DELETE FROM "${schema}".gifts WHERE id = $1`,
    [gift_id]
  );

  if (rowCount === 0) {
    throw new GIFT_MODEL_ERROR('GIFT_NOT_FOUND', 'Gift not found');
  }
}
