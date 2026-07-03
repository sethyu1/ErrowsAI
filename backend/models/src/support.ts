import { randomUUID } from "crypto";
import { Client } from "pg";
import { ModelError } from "./utils.js";

export class SUPPORT_MODEL_ERROR extends ModelError<
  | 'SUPPORT_NOT_FOUND'
> {}

interface SupportRecord {
  id: string;
  /** Present when listed via join with user_email; absent on create */
  user_id?: string | null;
  email: string;
  type: string;
  description: string;
  created_at: string;
}

interface CreateSupportParams {
  email: string;
  type: string;
  description: string;
}

// 创建 support 请求
export async function createSupport(
  client: Client,
  schema: string,
  params: CreateSupportParams
): Promise<SupportRecord> {
  const id = randomUUID();

  const { rows: [result] } = await client.query<SupportRecord>(
    `INSERT INTO "${schema}".supports (
      id, email, type, description
    ) VALUES ($1, $2, $3, $4)
    RETURNING id, email, type, description, created_at`,
    [id, params.email, params.type, params.description]
  );

  return result!;
}

interface ListSupportsParams {
  limit?: number;
  offset?: number;
}

interface ListSupportsResult {
  data: SupportRecord[];
  count: number;
}

// 查询 support 请求列表
export async function listSupports(
  client: Client,
  schema: string,
  params: ListSupportsParams = {}
): Promise<ListSupportsResult> {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const { rows: data } = await client.query<SupportRecord>(
    `SELECT s.id, ue.uid AS user_id, s.email, s.type, s.description, s.created_at
     FROM "${schema}".supports s
     LEFT JOIN "${schema}".user_email ue ON ue.email = s.email
     ORDER BY s.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const { rows } = await client.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${schema}".supports`
  );

  const count = rows[0]!.count

  return {
    data,
    count: parseInt(count, 10)
  };
}
