declare namespace API {
  namespace Permission {
    interface OP_PERMISSION {
      group: string; // 权限分组，eg：users、configuration etc。
      name: string; // users_create、configuration_update etc。
      title: string; // 权限标题，eg：创建用户、更新配置 etc。
    }

    interface OP_ROLE {
      id: string; // 角色ID
      name: string; // 角色名称，eg：管理员、普通用户 etc。
      permissions: string[]; // 角色所拥有的权限列表
      builtin: boolean; // 是否为内置角色
    }

    interface OP_USER {
      id: number;
      name: string;
      email: string;
      roles: OP_ROLE[];
      permissions: OP_PERMISSION[];
      sysadmin?: boolean;
    }

  }
}
