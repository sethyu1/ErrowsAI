import { Client } from 'pg';
import { ModelError } from './utils.js';

export class TASK_MODEL_ERROR extends ModelError<
| 'TASK_NOT_FOUND'
| 'TASK_ALREADY_CLAIMED'
| 'TASK_NOT_COMPLETED'
> {}

export interface UserTaskProgress {
  id: string;
  uid: string;
  progress: number;
  created_at: Date;
  completed_at: Date | null;
  claimed_at: Date | null;
  stv_tr: string;
}

// 获取用户今日任务进度
export async function getUserTaskProgress(
  client: Client, schema: string,
  uid: string,
  taskId: string
): Promise<UserTaskProgress | null> {
  const { rows: [task] } = await client.query<UserTaskProgress>(
    `SELECT id, uid, progress, created_at, completed_at, claimed_at, stv_tr
    FROM "${schema}".user_task_progress
    WHERE uid = $1 AND id = $2
      AND stv_tr @> NOW()`,
    [uid, taskId]
  );

  return task || null;
}

// 获取用户所有今日任务进度
export async function getUserTasksProgress(
  client: Client, schema: string,
  uid: string
): Promise<Map<string, UserTaskProgress>> {
  const { rows } = await client.query<UserTaskProgress>(
    `SELECT id, uid, progress, created_at, completed_at, claimed_at, stv_tr
    FROM "${schema}".user_task_progress
    WHERE uid = $1
      AND stv_tr @> NOW()`,
    [uid]
  );

  const map = new Map<string, UserTaskProgress>();
  for (const row of rows) {
    const data = Object.assign({}, row, { progress: Number(row.progress) });
    map.set(row.id, data);
  }
  return map;
}

// 完成任务
export async function completeTask(
  client: Client, schema: string,
  uid: string,
  taskId: string
): Promise<void> {
  const { rowCount } = await client.query(
    `UPDATE "${schema}".user_task_progress
    SET completed_at = NOW()
    WHERE uid = $1 AND id = $2
      AND stv_tr @> NOW()
      AND completed_at IS NULL`,
    [uid, taskId]
  );

  if (rowCount === 0) {
    throw new TASK_MODEL_ERROR('TASK_NOT_FOUND', 'Task not found or already completed');
  }
}

// 领取任务奖励
export async function claimTaskReward(
  client: Client, schema: string,
  uid: string,
  taskId: string
): Promise<void> {
  const { rowCount = 0 } = await client.query(
    `UPDATE "${schema}".user_task_progress
    SET claimed_at = NOW()
    WHERE uid = $1 AND id = $2
      AND stv_tr @> NOW()
      AND completed_at IS NOT NULL
      AND claimed_at IS NULL
    RETURNING *`,
    [uid, taskId]
  );

  if ((rowCount ?? 0) > 0) {
    return;
  }

  const task = await getUserTaskProgress(client, schema, uid, taskId);
  if (!task) {
    throw new TASK_MODEL_ERROR('TASK_NOT_FOUND', 'Task not found');
  }
  if (task.claimed_at) {
    throw new TASK_MODEL_ERROR('TASK_ALREADY_CLAIMED', 'Task reward already claimed');
  }
  if (!task.completed_at) {
    throw new TASK_MODEL_ERROR('TASK_NOT_COMPLETED', 'Task not completed yet');
  }
}

// 记录每日登录
export async function recordDailyLogin(
  client: Client, schema: string,
  uid: string,
  taskId: string
): Promise<void> {
  // 自动完成每日登录任务
  await client.query(
    `INSERT INTO "${schema}".user_task_progress
    (uid, id, progress, completed_at)
    SELECT $1, $2, 1, NOW()
    ON CONFLICT DO NOTHING`,
    [uid, taskId]
  );
}

// 记录任务进度（通用方法）
export async function recordTaskProgress(
  client: Client, schema: string,
  uid: string,
  taskId: string,
  goal: number,
  progressDelta: number = 1
): Promise<void> {
  // 先尝试插入新记录
  const { rowCount: insertCount } = await client.query(
    `INSERT INTO "${schema}".user_task_progress
    (uid, id, progress, completed_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT DO NOTHING`,
    [uid, taskId, progressDelta, goal === 1 ? new Date() : null]
  );

  // 如果插入成功（返回 rowCount > 0），说明是新记录，检查是否已达成目标
  if ((insertCount ?? 0) > 0) {
    return;
  }

  // 如果插入失败（冲突），说明记录已存在，需要更新进度
  // 在一个查询中同时处理进度增加和完成状态
  await client.query(
    `UPDATE "${schema}".user_task_progress
    SET
      progress = progress + $4,
      completed_at = CASE
        WHEN progress + $4 >= $3 AND completed_at IS NULL
        THEN NOW()
        ELSE completed_at
      END
    WHERE uid = $1 AND id = $2
      AND stv_tr @> NOW()`,
    [uid, taskId, goal, progressDelta]
  );
}
