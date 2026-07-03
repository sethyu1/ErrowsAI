import { Client } from 'pg';
import { ModelError } from './utils.js';
import { USER_PROFILE, USER_SUMMARY } from '@errows/types';

export class USER_MODEL_ERROR extends ModelError<
| 'EMAIL_NOT_FOUND'
| 'EMAIL_ALREADY_REGISTERED'
| 'EMAIL_NOT_VERIFIED'
| 'CODE_GEN_RATE_LIMIT'
| 'INVALID_CREDENTIALS'
| 'USER_NOT_FOUND'
| 'CODE_MISS_MATCH'
| 'CODE_EXPIRED'
> {}

// 注册新用户
export async function register(
  client: Client, schema: string,
  email: string,
  password: string,
  name: string
) {

  const { rows: [user] } = await client.query(
    `WITH
      email AS (
        INSERT INTO "${schema}".user_email(uid, email)
        VALUES (GEN_RANDOM_UUID(), $1)
        ON CONFLICT (email) DO NOTHING
        RETURNING uid, verified_at
      ),
      new_user AS (
        INSERT INTO "${schema}".users(id, name)
        SELECT uid, $2 FROM email
        RETURNING id
      ),
      password AS (
        INSERT INTO "${schema}".user_password(uid, hash)
        SELECT id, CRYPT($3, GEN_SALT('bf')) FROM new_user
        RETURNING uid
      )
      SELECT uid AS id, verified_at FROM password
      JOIN email USING(uid)
      UNION ALL
      SELECT uid AS id, verified_at FROM "${schema}".user_email WHERE email = $1`,
    [email, name, password]
  );

  if (user.verified_at !== null) {
    throw new USER_MODEL_ERROR(
      'EMAIL_ALREADY_REGISTERED',
      'Email is already registered.'
    );
  }

  return user;
}

// 更新用户信息
export async function updateProfile(
  client: Client, schema: string,
  uid: string, profile: Record<string, unknown>
) {
  const { name = null, ...updatedProfile } = profile;
  const { rows } = await client.query(
    `UPDATE "${schema}".users
      SET profile = COALESCE(profile, '{}')::JSONB || $3,
          name = COALESCE($2, name)
    WHERE id = $1
    RETURNING id, name, profile`,
    [uid, name, updatedProfile]
  );

  if (rows.length === 0) {
    throw new USER_MODEL_ERROR(
      "USER_NOT_FOUND",
      "User not found."
    );
  }

  return rows[0];
}

// 重置密码
export function resetPassword(
  client: Client, schema: string,
  uid: string, password: string
) {
  return client.query(
    `INSERT INTO "${schema}".user_password(uid, hash)
     VALUES ($1, CRYPT($2, GEN_SALT('bf')))
     ON CONFLICT (uid) DO UPDATE
     SET hash = CRYPT($2, GEN_SALT('bf'))`,
    [uid, password]
  );
}

export async function genVerificationCode(
  client: Client, schema: string,
  email: string, code: string, type: 1 | 2
) {
  let query;
  let params = [email, code];

  if (type === 1) {
    query = `
      WITH update_code AS (
        UPDATE "${schema}".user_email
        SET verify_code = $2, code_gen_at = NOW()
        WHERE email = $1 AND verified_at IS NULL
        RETURNING email
      )
      SELECT uid, email, verified_at, code_gen_at FROM "${schema}".user_email
      LEFT JOIN update_code USING(email)
      WHERE email = $1
    `;
  } else {
    query = `
      WITH update_code AS (
        UPDATE "${schema}".user_email
        SET verify_code = $2, code_gen_at = NOW()
        WHERE email = $1 AND verified_at IS NOT NULL
        RETURNING email
      )
      SELECT uid, email, verified_at, code_gen_at FROM "${schema}".user_email
      LEFT JOIN update_code USING(email)
      WHERE email = $1
    `;
  }

  const { rows: [res = null] } = await client.query(query, params);

  if (res === null) {
    throw new USER_MODEL_ERROR('EMAIL_NOT_FOUND', 'Email not found.');
  }

  if (type === 1 && res.verified_at !== null) {
    throw new USER_MODEL_ERROR('EMAIL_ALREADY_REGISTERED', 'Email is already registered.');
  }

  if (type === 2 && res.verified_at === null) {
    throw new USER_MODEL_ERROR('EMAIL_NOT_VERIFIED', 'Email not verified.');
  }

  if (res.code_gen_at === null) {
    if (type === 1) {
      throw new USER_MODEL_ERROR('EMAIL_ALREADY_REGISTERED', 'Email is already registered.');
    } else {
      throw new USER_MODEL_ERROR('EMAIL_NOT_VERIFIED', 'Email not verified.');
    }
  }

  const now = Date.now();
  const timeLimit = type === 1 ? 3 * 60 * 1000 : 3 * 6 * 1000;
  if ((now - res.code_gen_at.getTime()) < timeLimit) {
    throw new USER_MODEL_ERROR('CODE_GEN_RATE_LIMIT', 'Code generation rate limit exceeded');
  }

  return { uid: res.uid };
}

export async function genEmailVerifyCode(
  client: Client, schema: string,
  email: string, code: string
) {
  const { rows: [res = null] } = await client.query(
    `WITH update_code AS (
       UPDATE "${schema}".user_email
       SET verify_code = $2, code_gen_at = NOW()
       WHERE email = $1 AND verified_at IS NULL
      RETURNING email
    )
    SELECT email, verified_at, code_gen_at FROM "${schema}".user_email
    LEFT JOIN update_code USING(email)
    WHERE email = $1`,
    [email, code]
  );

  if (res === null) {
    throw new USER_MODEL_ERROR('EMAIL_NOT_FOUND');
  }

  if (res.verified_at !== null) {
    throw new USER_MODEL_ERROR(
      'EMAIL_ALREADY_REGISTERED',
      'Email is already registered.'
    );
  }

  if (res.code_gen_at === null) {
    return;
  }

  const now = Date.now();
  if ((now - res.code_gen_at.getTime()) < 3 * 60 * 1000) {
    throw new USER_MODEL_ERROR(
      'CODE_GEN_RATE_LIMIT',
      'Code generation rate limit exceeded'
    );
  }
}

export async function genPasswordResetCode(
  client: Client, schema: string,
  email: string, code: string
) {
    const { rows: [res = null] } = await client.query(
    `WITH update_code AS (
       UPDATE "${schema}".user_email
       SET verify_code = $2, code_gen_at = NOW()
       WHERE email = $1 AND verified_at IS NOT NULL
      RETURNING email
    )
    SELECT uid, email, verified_at, code_gen_at
    FROM "${schema}".user_email
    LEFT JOIN update_code USING(email)
    WHERE email = $1`,
    [email, code]
  );

  if (res === null) {
    throw new USER_MODEL_ERROR('EMAIL_NOT_FOUND');
  }

  if (res.verified_at === null) {
    throw new USER_MODEL_ERROR('EMAIL_NOT_VERIFIED');
  }

  const now = Date.now();
  if ((now - res.code_gen_at.getTime()) < 3 * 6 * 1000) {
    throw new USER_MODEL_ERROR(
      'CODE_GEN_RATE_LIMIT',
      'Code generation rate limit exceeded'
    );
  }

  if ((now - res.code_gen_at.getTime()) > 30 * 60 * 1000) {
    throw new USER_MODEL_ERROR(
      'CODE_EXPIRED',
      'Verification code is expired.'
    );
  }

  return res;
}

// 邮箱验证（用于ops，直接验证不需要code）
export async function emailVerifyForOps(
  client: Client, schema: string,
  uid: string
) {
  const { rows } = await client.query(
    `UPDATE "${schema}".user_email
    SET verified_at = NOW()
    WHERE uid = $1 AND verified_at IS NULL
    RETURNING uid`,
    [uid]
  );

  if (rows.length === 0) {
    throw new USER_MODEL_ERROR(
      'EMAIL_ALREADY_REGISTERED',
      'Email is already verified.'
    );
  }
}

// 验证邮箱
export async function emailVerify(
  client: Client, schema: string,
  uid: string, code: string
) {
  const { rows: [res = null] } = await client.query(
    `WITH verified_email AS (
      UPDATE "${schema}".user_email
        SET verified_at = NOW(), verify_code = NULL
      WHERE uid = $1 AND verify_code = $2
        AND code_gen_at > (NOW() - INTERVAL '30 MINUTE')
      RETURNING uid
    )
    SELECT uid,
      verified_email.uid IS NOT NULL AS verified,
      code_gen_at
    FROM "${schema}".user_email
    LEFT JOIN verified_email USING(uid)
    WHERE uid = $1`,
    [uid, code]
  );

  if (res === null) {
    throw new USER_MODEL_ERROR(
      "USER_NOT_FOUND",
      "User not found."
    );
  }

  if (res.code_gen_at.getTime() + 30 * 60 * 1000 < Date.now()) {
    throw new USER_MODEL_ERROR(
      "CODE_EXPIRED",
      "Verification code is expired."
    );
  }

  if (res.verified === false) {
    throw new USER_MODEL_ERROR(
      "CODE_MISS_MATCH",
      "Verification code mismatch."
    );
  }
}

// 用户身份验证（登录）
export async function authenticate(
  client: Client, schema: string,
  email: string,
  password: string
): Promise<{ uid: string }> {
  const { rows } = await client.query(
    `SELECT uid, verified_at
    FROM "${schema}".user_password
    JOIN "${schema}".user_email USING(uid)
    WHERE email = $1
      AND (hash = CRYPT($2, hash) OR hash = MD5($2))`,
    [email, password]
  );

  if (rows.length === 0) {
    throw new USER_MODEL_ERROR(
      "INVALID_CREDENTIALS",
      "Incorrect email or password."
    );
  }

  if (rows[0].verified_at === null) {
    throw new USER_MODEL_ERROR(
      "EMAIL_NOT_VERIFIED",
      'Email not verified.'
    );
  }

  return { uid : rows[0].uid };
}

// 根据ID查找用户
export async function findById(
  client: Client, schema: string, uid: string
): Promise<USER_PROFILE> {
  const { rows: [user = null] } = await client.query(
    `SELECT u.id, u.name, ue.email, um.mobile,
            COALESCE(ue.verified_at, um.verified_at) AS verified_at,
            u.profile,
            COALESCE(u.pixel, '{}'::jsonb) AS pixel
    FROM "${schema}".users AS u
    LEFT JOIN "${schema}".user_email AS ue ON ue.uid = u.id
    LEFT JOIN "${schema}".user_mobile AS um ON um.uid = u.id
    WHERE u.id = $1`,
    [uid]
  );

  if (user === null) {
    throw new USER_MODEL_ERROR(
      "USER_NOT_FOUND",
      "User not found."
    );
  }

  return Object.assign(
    {}, user,
    {
      profile: user.profile ?? {},
      pixel: user.pixel ?? {}
    }
  );
}

// 获取用户摘要信息
export async function summary(
  client: Client, schema: string, uid: string
): Promise<USER_SUMMARY> {
  const profile = await findById(client, schema, uid);
  const { id, name, profile: { avatar = null } } = profile;

  return { id, name, avatar };
}

// 根据ID列表批量获取用户摘要
export async function listSummaryByIds(
  client: Client, schema: string, ids: string[]
): Promise<USER_SUMMARY[]> {
  if (ids.length === 0) {
    return [];
  }
  const { rows } = await client.query(
    `SELECT u.id, name, profile ->> 'avatar' AS avatar
    FROM "${schema}".users AS u
    JOIN (SELECT UNNEST($1::UUID[]) AS id) AS ids USING(id)`,
    [ids]
  );

  return rows;
}

// 查询用户列表
export async function listUsers(
  client: Client, schema: string,
  options: {
    page?: number;
    size?: number;
    q?: string;
    ids?: string[];
  } = {}
): Promise<{ count: number; data: USER_PROFILE[] }> {
  const page = options.page || 0;
  const size = options.size || 20;
  const offset = page * size;

  let whereClause = '';
  let params: any[] = [];
  let paramIndex = 1;

  if (options.ids && options.ids.length > 0) {
    whereClause = `WHERE u.id = ANY($${paramIndex})`;
    params.push(options.ids);
    paramIndex++;
  } else if (options.q) {
    whereClause = `WHERE ue.email ILIKE $${paramIndex}`;
    params.push(`%${options.q}%`);
    paramIndex++;
  }

  // Get count
  const { rows: countRows } = await client.query(
    `SELECT COUNT(*) as count
     FROM "${schema}".users u
     LEFT JOIN "${schema}".user_email ue ON u.id = ue.uid
     ${whereClause}`,
    params
  );

  const count = parseInt(countRows[0].count);

  // Get data
  params.push(size, offset);
  const { rows: users } = await client.query(
    `SELECT
      u.id,
      u.name,
      ue.email,
      u.profile
     FROM "${schema}".users u
     LEFT JOIN "${schema}".user_email ue ON u.id = ue.uid
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params
  );

  return {
    count,
    data: users
  };
}

// 删除用户账号
export async function deleteAccount(
  client: Client, schema: string,
  uid: string
) {
  const res = await client.query(
    `WITH archive AS (
      INSERT INTO "${schema}".user_archive(id, email, name, profile)
      SELECT id, email, name, profile
      FROM "${schema}".users
      JOIN "${schema}".user_email ON user_email.uid = users.id
      WHERE id = $1
      RETURNING id
    )
    DELETE FROM "${schema}".users
    USING archive
    WHERE users.id = archive.id`,
    [uid]
  );

  if (res.rowCount === 0) {
    throw new USER_MODEL_ERROR(
      "USER_NOT_FOUND",
      "User not found."
    );
  }
}

// OAuth 用户登录或注册
export async function oauth(
  client: Client, schema: string,
  email: string,
  name: string
): Promise<{ id: string; isNew: boolean }> {
  const { rows: [user] } = await client.query(
    `WITH email AS (
        INSERT INTO "${schema}".user_email(uid, email, verified_at)
        VALUES (GEN_RANDOM_UUID(), $1, NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING uid
      ),
      new_user AS (
        INSERT INTO "${schema}".users(id, name)
        SELECT uid, $2 FROM email
        RETURNING id
      )
      SELECT id, true AS is_new FROM new_user
      UNION ALL
      SELECT uid AS id, false AS is_new
      FROM "${schema}".user_email WHERE email = $1`,
    [email, name]
  );

  return { id: user.id, isNew: user.is_new };
}

// 绑定 pixel 信息
export async function bindPixel(
  client: Client, schema: string,
  uid: string,
  pixel: Record<string, string>
): Promise<void> {
  const { rowCount } = await client.query(
    `UPDATE "${schema}".users
     SET pixel = $2
     WHERE id = $1`,
    [uid, JSON.stringify(pixel)]
  );

  if (rowCount === 0) {
    throw new USER_MODEL_ERROR(
      "USER_NOT_FOUND",
      "User not found."
    );
  }
}

// 保存用户登录日志
export async function saveLoginLog(
  client: Client, schema: string,
  userId: string,
  email: string,
  action: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await client.query(
    `INSERT INTO "${schema}".user_login_log(user_id, email, action, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, email, action, ipAddress || null, userAgent || null]
  );
}