
// 查询 member 统计数据

import { MEMBER_INFO, MEMBER_STATS } from "@errows/types";
import { Client } from "pg";
import { ModelError } from "./utils.js";
import { PAYMENT_TRANSACTION_ACTIONS } from "./constrains.js";

export class MEMBER_MODEL_ERROR extends ModelError<
| 'MEMBER_NOT_FOUND'
>{}

// 聚合会员使用统计数据
export async function agg_stats(
  client: Client, schema: string,
  uid: string
): Promise<MEMBER_STATS> {
  const { rows: [res] } = await client.query<{ stats: MEMBER_STATS }>(
    `SELECT
      JSON_OBJECT_AGG(type, count) AS stats
    FROM ${schema}.members_stats
    WHERE uid = $1
    GROUP BY uid`,
    [uid]
  );

  return Object.assign(
    {
      media_images: 0,
      media_videos: 0,
      characters_public: 0,
      characters_private: 0,
      characters_deleted: 0,
      characters_followed: 0,
      characters_liked: 0,
      session_messages: 0,
      posts: 0,
    },
    res?.stats
  );
}

// 更新会员使用统计数据
export async function update_stats(
  client: Client, schema: string,
  uid: string,
  changeset: [type: keyof MEMBER_STATS, delta: number][]
): Promise<void> {

  const [types, deltas] = changeset.reduce(
    (acc, [type, delta]) => {
      acc[0].push(type);
      acc[1].push(delta);
      return acc;
    },
    [[] as string[], [] as number[]]
  );

  await client.query(
    `INSERT INTO ${schema}.members_stats (uid, type, count)
    SELECT $1 AS uid, type, count
    FROM UNNEST($2::TEXT[], $3::INT[]) AS t(type, count)
    ON CONFLICT (uid, type)
    DO UPDATE SET
      count = (${schema}.members_stats.count + EXCLUDED.count)`,
    [uid, types, deltas]
  );
}

// 获取会员信息
export async function info(
  client: Client, schema: string,
  uid: string
): Promise<MEMBER_INFO> {
  const memberInfo: MEMBER_INFO = {
    id: uid,
    plan: 'free',
    plan_type: null,
    credential_id: null,
    subscription_id: null,
    valid_until: '9999-12-31',
    coin_free_balance: 0,
    coin_purchased_balance: 0,
  };

  const { rows: memberCoins } = await client.query(
    `SELECT type, SUM(amount - spend_amount) AS amount
    FROM ${schema}.members_coins
    WHERE uid = $1 AND stv_tr @> NOW() AND amount > spend_amount
    GROUP BY type`,
    [uid]
  );

  Object.assign(
    memberInfo,
    Object.fromEntries(memberCoins.map(
      row => [`coin_${row.type}_balance`, Number(row.amount)]
    ))
  );

  const { rows: [plan] } = await client.query<MEMBER_INFO>(
    `SELECT
      plan, plan_type, credential_id, subscription_id,
      UPPER(plan.stv_tr) AS valid_until
    FROM ${schema}.members_plan plan
    WHERE id = $1 AND stv_tr @> NOW()`,
    [uid]
  );

  if (plan) {
    Object.assign(memberInfo, plan);``
  }

  return memberInfo;
}
