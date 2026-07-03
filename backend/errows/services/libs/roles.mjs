import { Role } from "@errows/models";
import { userErrorHandler } from "./error.mjs";


export const actions = {
  permission_list: {
    rest: 'GET   /permissions',
    async handler() {
      const permissions = await this.readPermissions();
      return permissions;
    }
  },

  role_list: {
    rest: 'GET   /roles',
    async handler() {
      const schema = this.buildSchema();
      const client = this.pool;

      const roles = await Role.listRoles(client, schema);

      return roles
      .filter(role => role.builtin !== true);
    }
  },

  role_create: {
    rest: 'POST  /roles',
    params: {
      name: 'string',
      permissions: { type: 'array', items: 'string' },
    },
    async handler(ctx) {
      const { name, permissions } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      const roleId = await Role.createRole(client, schema, name, permissions);
      return { id: roleId };
    }
  },

  role_update: {
    rest: 'PUT   /roles/:role_id',
    params: {
      role_id: 'uuid',
      name: 'string',
      permissions: { type: 'array', items: 'string' },
    },
    async handler(ctx) {
      const { role_id, name, permissions } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;
      await Role.updateRole(client, schema, role_id, name, permissions);
    }
  },

  role_delete: {
    rest: 'DELETE /roles/:role_id',
    params: {
      role_id: 'uuid',
    },
    async handler(ctx) {
      const { role_id } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      await Role.deleteRole(client, schema, role_id);
    }
  },

  role_user_set_system_admin: {
    params: {
      uid: 'uuid',
    },
    async handler(ctx) {
      const { uid } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      await Role.setUserSysadmin(client, schema, uid);
    }
  },

  user_profile: {
    rest: `GET   /users/profile`,
    async handler(ctx) {
      const uid = ctx.meta.user.uid;
      const schema = this.buildSchema();
      const client = this.pool;

      const user = await ctx.call('user.profile', { uid })
      .then(res => res, userErrorHandler);

      const allPermissions = await this.readPermissions();
      const permissionMap = allPermissions.reduce((map, perm) => {
        map[perm.name] = perm;
        return map;
      }, {});

      const { roles, permissions } = await Role.getUserRoleAndPermissions(client, schema, uid);
      const sysadmin = roles.some(r => r.name === 'sysadmin' && r.builtin === true);

      // Sysadmin users get all permissions
      const userPermissions = sysadmin
        ? allPermissions
        : permissions.map(pname => permissionMap[pname]).filter(p => p);

      Object.assign(user, { roles, permissions: userPermissions, sysadmin });
      return user;
    }
  },

  user_create: {
    rest: 'POST  /users',
    params: {
      email: 'email',
      name: 'string',
      password: 'string',
      roles: { type: 'array', items: 'string' },
    },
    async handler(ctx) {
      const { email, name, password, roles } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      // Create user in user service (includes email verification and member init)
      const { id } = await ctx.call('user.user_create_ops', {
        email,
        name,
        password
      });

      // Assign roles
      await Role.updateUserRoles(client, schema, id, roles);

      return { id };
    }
  },

  user_list: {
    rest: 'GET   /users',
    params: {
      has_op_role: { type: 'boolean', optional: true, default: false, convert: true },
      page: { type: 'number', optional: true, default: 0, convert: true },
      size: { type: 'number', optional: true, default: 20, convert: true },
      q: { type: 'string', optional: true },
    },
    async handler(ctx) {
      const { has_op_role, page, size, q } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      const allPermissions = await this.readPermissions();
      const permissionMap = allPermissions.reduce((map, perm) => {
        map[perm.name] = perm;
        return map;
      }, {});

      // Build query params
      const queryParams = { page, size, q };

      if (has_op_role) {
        // Get all user IDs that have roles assigned
        const userIds = await Role.listUserIdsByRoles(client, schema);

        if (userIds.length === 0) {
          return { count: 0, data: [] };
        }

        queryParams.ids = userIds;
      }

      // Get user info from user service
      const userListResult = await ctx.call('user.user_list', queryParams);

      // Batch get roles and permissions for all users
      const userIds = userListResult.data.map(user => user.id);
      const userRolesMap = await Role.batchGetUserRolesAndPermissions(client, schema, userIds);

      // Enrich with roles and permissions
      const enrichedUsers = userListResult.data.map((user) => {
        const roleData = userRolesMap.get(user.id) || { roles: [], permissions: [] };
        const sysadmin = roleData.roles
        .some(r => r.name === 'sysadmin' && r.builtin === true);

        const roles = roleData.roles.filter(r => r.builtin !== true);

        // Sysadmin users get all permissions
        const permissions = sysadmin
          ? allPermissions
          : roleData.permissions.map(pname => permissionMap[pname]).filter(p => p);

        return {
          ...user,
          sysadmin,
          roles,
          permissions
        };
      });

      return {
        count: userListResult.count,
        data: enrichedUsers
      };
    }
  },

  user_roles_update: {
    rest: 'PUT   /users/:user_id',
    params: {
      user_id: 'uuid',
      roles: { type: 'array', items: 'uuid' },
    },
    async handler(ctx) {
      const { user_id, roles } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      // Check if user has sysadmin role
      const { roles: currentRoles } = await Role.getUserRoleAndPermissions(client, schema, user_id);
      const sysadminRole = currentRoles.find(r => r.name === 'sysadmin' && r.builtin === true);

      const updatedRoles = [...roles];

      if (sysadminRole) {
        // Ensure sysadmin role is included
        if (!updatedRoles.includes(sysadminRole.id)) {
          updatedRoles.unshift(sysadminRole.id);
        }
      }

      await Role.updateUserRoles(client, schema, user_id, updatedRoles);

      ctx.meta.$statusCode = 204;
    }
  },
};