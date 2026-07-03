import { Client } from "pg";
import { ModelError } from "./utils.js";

export class CONFIGURATION_MODEL_ERROR extends ModelError<
  | 'CONFIGURATION_NOT_FOUND'
> {};

/**
 * 获取配置值
 * @param client - 数据库客户端
 * @param schema - 数据库模式
 * @param scope - 配置范围
 * @param key - 配置键
 * @returns 配置值（JSONB）
 */
export async function getConfiguration<T = any>(
  client: Client,
  schema: string,
  scope: string,
  key: string | null = null
): Promise<T | null> {
  const { rows } = await client.query<{ value: T }>(
    `SELECT value FROM "${schema}".configurations
     WHERE scope = $1 AND key IS NOT DISTINCT FROM $2`,
    [scope, key]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0]!.value;
}

/**
 * 设置配置值（插入或更新）
 * @param client - 数据库客户端
 * @param schema - 数据库模式
 * @param scope - 配置范围
 * @param key - 配置键
 * @param value - 配置值（将被转换为 JSONB）
 */
export async function setConfiguration(
  client: Client,
  schema: string,
  scope: string,
  key: string | null,
  value: any
): Promise<void> {
  await client.query(
    `INSERT INTO "${schema}".configurations (scope, key, value)
     VALUES ($1, $2, $3)
     ON CONFLICT (scope, key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [scope, key, JSON.stringify(value)]
  );
}

/**
 * 删除配置
 * @param client - 数据库客户端
 * @param schema - 数据库模式
 * @param scope - 配置范围
 * @param key - 配置键（null 表示删除整个 scope）
 */
export async function deleteConfiguration(
  client: Client,
  schema: string,
  scope: string,
  key: string | null = null
): Promise<void> {
  await client.query(
    `DELETE FROM "${schema}".configurations
     WHERE scope = $1 AND key IS NOT DISTINCT FROM $2`,
    [scope, key]
  );
}

/**
 * 列出指定范围内的所有配置
 * @param client - 数据库客户端
 * @param schema - 数据库模式
 * @param scope - 配置范围
 * @returns 配置键值对数组
 */
export async function listConfigurations(
  client: Client,
  schema: string,
  scope: string
): Promise<Array<{ key: string | null; value: any }>> {
  const { rows } = await client.query<{ key: string | null; value: any }>(
    `SELECT key, value FROM "${schema}".configurations
     WHERE scope = $1
     ORDER BY key`,
    [scope]
  );

  return rows;
}

/**
 * 分页获取指定范围内的配置列表
 * @param client - 数据库客户端
 * @param schema - 数据库模式
 * @param scope - 配置范围
 * @param page - 页码（从 0 开始）
 * @param size - 每页数量
 * @returns 包含总数和数据的分页结果
 */
export async function listConfigurationsPaginated<T = any>(
  client: Client,
  schema: string,
  scope: string,
  page: number = 0,
  size: number = 20
): Promise<{ count: number; data: Array<{ key: string; value: T }> }> {
  const offset = page * size;

  // 获取总数
  const countResult = await client.query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM "${schema}".configurations
     WHERE scope = $1`,
    [scope]
  );
  const count = parseInt(countResult.rows[0]!.count, 10);

  // 获取分页数据
  const dataResult = await client.query<{ key: string; value: T }>(
    `SELECT key, value
     FROM "${schema}".configurations
     WHERE scope = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [scope, size, offset]
  );

  return {
    count,
    data: dataResult.rows
  };
}
