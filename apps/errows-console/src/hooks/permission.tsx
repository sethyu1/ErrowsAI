import {
  createRoleApi,
  createUserApi,
  deleteRoleApi,
  getPermissionsApi,
  getRolesApi,
  getUsersApi,
  updateRoleApi,
  updateUserApi,
  getUserProfileApi,
} from "@/apis/permission";
import React from "react";
import { message, Skeleton } from "antd";
import { PermissionType } from "@/types";

export const useFetchUserProfile = () => {
  const [data, setData] = React.useState<API.Permission.OP_USER | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [_, refetch] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    (async function () {
      try {
        setLoading(true);
        const data = await getUserProfileApi();
        setData(data);
        setLoaded(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [_]);

  return { data, loading, loaded, refetch };
};

export const useFetchPermissions = () => {
  const [data, setData] = React.useState<API.Permission.OP_PERMISSION[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [_, refetch] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    (async function () {
      try {
        setLoading(true);
        const data = await getPermissionsApi();
        setData(data);
        setLoaded(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [_]);

  return { data, loading, loaded, refetch };
};

export const useRoles = () => {
  const [data, setData] = React.useState<API.Permission.OP_ROLE[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [optioning, setOptioning] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [_, refetch] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    (async function () {
      try {
        setLoading(true);
        const data = await getRolesApi();
        //过滤系统内置角色
        setData(data?.filter((item) => !item.builtin) ?? []);
        setLoaded(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [_]);

  const createRole = async (data: API.Permission.OP_ROLE) => {
    try {
      setOptioning(true);
      const res = await createRoleApi(data);
      refetch();
      message.success("创建角色成功");
      return res;
    } catch (error) {
      console.error(error);
      message.error("创建角色失败");
    } finally {
      setOptioning(false);
    }
  };

  const updateRole = async (role_id: string, data: API.Permission.OP_ROLE) => {
    try {
      setOptioning(true);
      const res = await updateRoleApi(role_id, data);
      refetch();
      message.success("更新角色成功");
      return res;
    } catch (error) {
      console.error(error);
      message.error("更新角色失败");
    } finally {
      setOptioning(false);
    }
  };

  const deleteRole = async (role_id: string) => {
    try {
      setOptioning(true);
      const res = await deleteRoleApi(role_id);
      refetch();
      message.success("删除角色成功");
      return res;
    } catch (error) {
      console.error(error);
      message.error("删除角色失败");
    } finally {
      setOptioning(false);
    }
  };

  return {
    data,
    loading,
    loaded,
    optioning,
    refetch,
    createRole,
    updateRole,
    deleteRole,
  };
};

export const useUsers = () => {
  const [data, setData] = React.useState<API.Permission.OP_USER[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [optioning, setOptioning] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [_, refetch] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    (async function () {
      try {
        setLoading(true);
        const data = await getUsersApi();
        setData(data?.data);
        setLoaded(true);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [_]);

  const createUser = async (data: API.Permission.OP_USER) => {
    try {
      setOptioning(true);
      const res = await createUserApi(data);
      refetch();
      message.success("创建用户成功");
      return res;
    } catch (error) {
      console.error(error);
      message.error("创建用户失败");
    } finally {
      setOptioning(false);
    }
  };

  const updateUser = async (user_id: string, data: API.Permission.OP_USER) => {
    try {
      setOptioning(true);
      const res = await updateUserApi(user_id, data);
      refetch();
      message.success("更新用户成功");
      return res;
    } catch (error) {
      console.error(error);
      message.error("更新用户失败");
    } finally {
      setOptioning(false);
    }
  };

  const deleteUser = async (user_id: string) => {
    message.error("删除用户功能暂未实现");
  };

  return {
    data,
    loading,
    loaded,
    optioning,
    refetch,
    createUser,
    updateUser,
    deleteUser,
  };
};

type PermissionHookResult<T> = {
  data: T;
  loading: boolean;
  loaded: boolean;
  refetch: () => void;
};

type PermissionContextType = {
  permissions: PermissionHookResult<API.Permission.OP_PERMISSION[]>;
  roles: ReturnType<typeof useRoles>;
  users: ReturnType<typeof useUsers>;
  userProfile: ReturnType<typeof useFetchUserProfile>;
  userPermissions: string[];
  hasPermission: (permission: PermissionType) => boolean;
  isAdmin: boolean;
};

export const PermissionContext = React.createContext<PermissionContextType>(
  {} as PermissionContextType
);

//这个是徐彤管理员的权限表，为了整体权限的一致性，将其转换成权限的方式
const adminPermissions = [
  "permission_users_edit",
  "permission_users_delete",
  "permission_users_create",
];

export const PermissionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const permissions = useFetchPermissions();
  const roles = useRoles();
  const users = useUsers();
  const userProfile = useFetchUserProfile();
  const isAdmin = React.useMemo(() => {
    return !!userProfile?.data?.sysadmin;
  }, [userProfile?.data]);
  //TODO这里如果是管理员，则会手动注入一些权限
  const userPermissions = React.useMemo(() => {
    return (userProfile?.data?.roles ?? [])?.reduce((prev, role) => {
      const toleId = role.id;
      const rolePermissions = roles.data.find(
        (role) => role.id === toleId
      )?.permissions;
      if (Array.isArray(rolePermissions)) {
        return Array.from(new Set([...prev, ...rolePermissions]));
      }
      return prev;
    }, [] as string[]);
  }, [roles.data, userProfile.data]);

  const rolePermissions = React.useMemo(() => {
    if (isAdmin) {
      return (permissions?.data?.map((item) => item.name) ?? [])?.concat(
        adminPermissions
      );
    }
    return userPermissions;
  }, [userPermissions, permissions, isAdmin]);

  const hasPermission = React.useMemo(() => {
    return (permission: PermissionType) => {
      return rolePermissions.includes(permission);
    };
  }, [rolePermissions]);

  if (
    permissions.loading ||
    roles.loading ||
    users.loading ||
    userProfile.loading
  ) {
    return <Skeleton active />;
  }

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        roles,
        users,
        userProfile,
        userPermissions: rolePermissions,
        hasPermission,
        isAdmin,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  return React.useContext(PermissionContext);
};

export const connect = (Component: React.ComponentType<any>) => {
  return (props: any) => {
    return <PermissionProvider>{<Component {...props} />}</PermissionProvider>;
  };
};
