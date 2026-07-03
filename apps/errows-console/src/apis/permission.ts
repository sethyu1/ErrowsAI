import { request } from "@/apis/request";

type API_LIST_RESPONSE<T> = {
  count: number;
  data: T;
}

/**
 * 获取权限列表
 * GET /ops/permissions
 * @returns 权限列表
 */
export function getPermissionsApi() {
  return request.get<API.Permission.OP_PERMISSION[]>("/ops/permissions");
}

/**
 * 获取角色列表
 * GET /ops/roles
 * @returns 角色列表
 */
export function getRolesApi() {
  return request.get<API.Permission.OP_ROLE[]>("/ops/roles");
}


/**
 * 创建角色
 * POST /ops/roles
 * @param data 角色数据
 * @returns 角色ID
 */
export function createRoleApi(data: API.Permission.OP_ROLE) {
  return request.post<string>("/ops/roles", data);
}

/**
 * 修改角色
 * PUT /ops/roles/:role_id
 * @param role_id 角色ID
 * @param data 角色数据
 * @returns 角色ID
 */
export function updateRoleApi(role_id: string, data: API.Permission.OP_ROLE) {
  return request.put<string>(`/ops/roles/${role_id}`, data);
}

/**
 * 删除角色
 * DELETE /ops/roles/:role_id
 * @param role_id 角色ID
 * @returns 角色ID
 */
export function deleteRoleApi(role_id: string) {
  return request.delete<string>(`/ops/roles/${role_id}`);
}

/**
 * 获取用户列表
 * GET /ops/users
 * @returns 用户列表
 */ 
export function getUsersApi() {
  return request.get<API_LIST_RESPONSE<API.Permission.OP_USER[]>>("/ops/users", {
    params: {
      has_op_role: true,
      page: 0,
      size: 100,
    },
  });
}

/**
 * 创建用户
 * POST /ops/users
 * @param data 用户数据
 * @returns 用户ID
 */
export function createUserApi(data: API.Permission.OP_USER) {
  return request.post<string>("/ops/users", data);
}

/**
 * 修改用户
 * PUT /ops/users/:user_id
 * @param user_id 用户ID
 * @param data 用户数据
 * @returns 用户ID
 */
export function updateUserApi(user_id: string, data: API.Permission.OP_USER) {
  return request.put<string>(`/ops/users/${user_id}`, data);
}

/**
 * 获取用户个人信息
 * GET /ops/users/profile
 * @returns 用户个人信息
 */
export function getUserProfileApi() {
  return request.get<API.Permission.OP_USER>("/ops/users/profile");
}