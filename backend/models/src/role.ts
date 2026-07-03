import { OP_PERMISSION, OP_ROLE } from "@errows/types";
import { Client } from "pg";
import { ModelError } from "./utils.js";

export class ROLE_MODEL_ERROR extends ModelError<
| 'SYSADMIN_ROLE_CANNOT_BE_MODIFIED'
| 'SYSADMIN_ROLE_CANNOT_BE_DELETED'
| 'SYSADMIN_ROLE_NOT_FOUND'
| 'ROLE_NAME_ALREADY_EXISTS'
| 'ROLE_NOT_FOUND'
> {}

/**
 * 通过 role id 设置用户角色
 */
export async function updateUserRoles(
  client: Client, system: string,
  uid: string, roleIds: string[]
): Promise<void> {
  // Delete existing user roles
  await client.query(
    `DELETE FROM "${system}".op_user_roles WHERE user_id = $1`,
    [uid]
  );

  // Insert new roles if any
  if (roleIds.length > 0) {
    const values = roleIds
      .map((_, idx) => `($1, $${idx + 2})`)
      .join(', ');

    await client.query(
      `INSERT INTO "${system}".op_user_roles (user_id, role_id) VALUES ${values}`,
      [uid, ...roleIds]
    );
  }
}

// 查询 sysadmin id 设置用户角色
export async function setUserSysadmin(
  client: Client, system: string, uid: string
) {
  const { rows } = await client.query(
    `SELECT id FROM "${system}".op_roles WHERE name = $1`,
    ['sysadmin']
  );

  if (rows.length === 0) {
    throw new ROLE_MODEL_ERROR('SYSADMIN_ROLE_NOT_FOUND', 'Sysadmin role not found');
  }

  const sysadminRoleId = rows[0].id;
  await updateUserRoles(client, system, uid, [sysadminRoleId]);
}

// 列出所有角色
export async function listRoles(
  client: Client, system: string
): Promise<OP_ROLE[]> {
  const { rows: roles } = await client.query(
    `SELECT
      r.id,
      r.builtin,
      r.name,
      r.description,
      r.permissions,
      created_at,
      updated_at
    FROM "${system}".op_roles r
    ORDER BY updated_at DESC`
  );

  return roles;
}

// 创建新角色
export async function createRole(
  client: Client, system: string,
  name: string, permissions: string[]
): Promise<string> {
  // Check if role name already exists
  const { rows: existing } = await client.query(
    `SELECT id FROM "${system}".op_roles WHERE name = $1`,
    [name]
  );

  if (existing.length > 0) {
    throw new ROLE_MODEL_ERROR('ROLE_NAME_ALREADY_EXISTS', 'Role name already exists');
  }

  const { rows } = await client.query(
    `INSERT INTO "${system}".op_roles (name, permissions)
     VALUES ($1, $2)
     RETURNING id`,
    [name, permissions]
  );

  return rows[0].id;
}

// 更新角色
export async function updateRole(
  client: Client, system: string,
  roleId: string, name: string, permissions: string[]
): Promise<void> {
  // Check if role exists and is not builtin
  const { rows: existing } = await client.query(
    `SELECT id, name, builtin FROM "${system}".op_roles WHERE id = $1`,
    [roleId]
  );

  if (existing.length === 0) {
    throw new ROLE_MODEL_ERROR('ROLE_NOT_FOUND', 'Role not found');
  }

  if (existing[0].builtin === true) {
    throw new ROLE_MODEL_ERROR('SYSADMIN_ROLE_CANNOT_BE_MODIFIED', 'Built-in roles cannot be modified');
  }

  // Check if new name conflicts with existing role (except itself)
  const { rows: nameConflict } = await client.query(
    `SELECT id FROM "${system}".op_roles WHERE name = $1 AND id != $2`,
    [name, roleId]
  );

  if (nameConflict.length > 0) {
    throw new ROLE_MODEL_ERROR('ROLE_NAME_ALREADY_EXISTS', 'Role name already exists');
  }

  await client.query(
    `UPDATE "${system}".op_roles
     SET name = $1, permissions = $2, updated_at = NOW()
     WHERE id = $3`,
    [name, permissions, roleId]
  );
}

// 删除角色
export async function deleteRole(
  client: Client, system: string,
  roleId: string
): Promise<void> {
  // Check if role exists and is not builtin
  const { rows: existing } = await client.query(
    `SELECT id, name, builtin FROM "${system}".op_roles WHERE id = $1`,
    [roleId]
  );

  if (existing.length === 0) {
    throw new ROLE_MODEL_ERROR('ROLE_NOT_FOUND', 'Role not found');
  }

  if (existing[0].builtin === true) {
    throw new ROLE_MODEL_ERROR('SYSADMIN_ROLE_CANNOT_BE_DELETED', 'Built-in roles cannot be deleted');
  }

  // Delete role (cascade will remove user role associations)
  await client.query(
    `DELETE FROM "${system}".op_roles WHERE id = $1`,
    [roleId]
  );
}

// 获取所有分配了角色的用户ID列表
export async function listUserIdsByRoles(
  client: Client, system: string
): Promise<string[]> {
  const { rows } = await client.query(
    `SELECT DISTINCT user_id FROM "${system}".op_user_roles`
  );

  return rows.map(row => row.user_id);
}

// 批量获取多个用户的角色和权限
export async function batchGetUserRolesAndPermissions(
  client: Client, system: string,
  uids: string[]
): Promise<Map<string, { roles: OP_ROLE[]; permissions: string[] }>> {
  if (uids.length === 0) {
    return new Map();
  }

  // Get all roles for all users
  const { rows: userRoles } = await client.query(
    `SELECT
      ur.user_id,
      r.id,
      r.builtin,
      r.name,
      r.description,
      r.permissions
    FROM "${system}".op_user_roles ur
    JOIN "${system}".op_roles r ON r.id = ur.role_id
    WHERE ur.user_id = ANY($1)
    ORDER BY ur.user_id, r.name`,
    [uids]
  );

  // Group by user_id
  const userRolesMap = new Map<string, { roles: OP_ROLE[]; permissions: string[] }>();

  uids.forEach(uid => {
    userRolesMap.set(uid, { roles: [], permissions: [] });
  });

  userRoles.forEach(row => {
    const userRoleData = userRolesMap.get(row.user_id);
    if (userRoleData) {
      userRoleData.roles.push({
        id: row.id,
        builtin: row.builtin,
        name: row.name,
        permissions: row.permissions || []
      });
    }
  });

  // Collect unique permissions for each user
  userRolesMap.forEach((data, uid) => {
    const allPermissions = Array.from(new Set(
      data.roles.flatMap(role => role.permissions)
    ));
    data.permissions = allPermissions;
  });

  return userRolesMap;
}

// 获取用户角色和权限, 权限是每个角色权限的去重合集
export async function getUserRoleAndPermissions(
  client: Client, system: string,
  uid: string
): Promise<{ roles: OP_ROLE[]; permissions: string[] }> {
  // Get user roles with permissions
  const { rows: roles } = await client.query(
    `SELECT
      r.id,
      r.builtin,
      r.name,
      r.description,
      r.permissions
    FROM "${system}".op_roles r
    JOIN "${system}".op_user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = $1
    ORDER BY r.name`,
    [uid]
  );

  const allPermissions = Array.from(new Set(
    roles.flatMap((role) => role.permissions))
  );

  return {
    roles: roles,
    permissions: allPermissions
  };
}
