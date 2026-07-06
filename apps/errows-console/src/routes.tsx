import React from "react";
import { Navigate } from "react-router";
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
  FileTextOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  DollarOutlined,
  CrownOutlined,
  SwapOutlined,
  GiftOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  SmileOutlined,
  CalendarOutlined,
  SafetyOutlined,
  QuestionCircleOutlined,
  CustomerServiceOutlined,
  KeyOutlined,
  SignatureOutlined,
  IdcardOutlined,
  FundOutlined,
  LineChartOutlined,
  StockOutlined,
  TableOutlined,
  RiseOutlined,
  BugOutlined,
} from "@ant-design/icons";

const GRAFANA_PREFIX_URL = window.location.origin.includes('localhost') ? 'https://grafana.example.com' :  window.location.origin;

// 页面组件懒加载
const Dashboard = React.lazy(() => import("./pages/dashboard"));
const Pixel = React.lazy(() => import("./pages/pixel"));
const RedditPixel = React.lazy(() => import("./pages/reddit-pixel"));
const XPixel = React.lazy(() => import("./pages/x-pixel"));
const ConfigOverview = React.lazy(() => import("./pages/configs/overview"));
const GiftsConfig = React.lazy(() => import("./pages/configs/gifts"));
const LegalConfig = React.lazy(() => import("./pages/configs/legal"));
const MembershipConfig = React.lazy(() => import("./pages/member-shrip"));
const GenerateParams = React.lazy(() => import("./pages/generate-params"));
const LanguageConfig = React.lazy(() => import("./pages/language"));
const UsersManagement = React.lazy(() => import("./pages/permission/users"));
const RolesManagement = React.lazy(() => import("./pages/permission/roles"));
const Coins = React.lazy(() => import('./pages/configs/coins'));
const CdkeyConfig = React.lazy(() => import('./pages/configs/cdkey'));
const RolesList = React.lazy(() => import("./pages/roles/list"));
const RolesCreate = React.lazy(() => import("./pages/roles/create"));
const LLMVisualization = React.lazy(() => import("./pages/visualization/llm"));
const UserVisualization = React.lazy(() => import("./pages/visualization/user"));
const SupportList = React.lazy(() => import("./pages/configs/support"));
const LLMDebugPage = React.lazy(() => import("./pages/llm-debug"));
const HomeDisplayConfig = React.lazy(() => import("./pages/configs/home-display"));

// 路由配置类型
export interface RouteConfig {
  path: string;
  name: string;
  icon?: React.ReactNode;
  element?: React.ReactNode;
  children?: RouteConfig[];
  hideInMenu?: boolean;
  permission?: string;
  linkUrl?: string;
}

// 统一的路由和菜单配置
export const routes: RouteConfig[] = [
  {
    path: "/dashboard",
    name: "BI可视化",
    icon: <DashboardOutlined />,
    permission: "dashboard_view",
    children: [
      {
        path: "/dashboard/llm",
        name: "模型接口调用",
        icon: <PictureOutlined />,
        element: <LLMVisualization />,
        permission: "dashboard_llm_view",
        linkUrl: `${GRAFANA_PREFIX_URL}/grafana/goto/df8tks51oqvwga?orgId=1`,
      },
      {
        path: "/dashboard/user",
        name: "用户登录信息",
        icon: <VideoCameraOutlined />,
        element: <UserVisualization />,
        permission: "dashboard_user_view",
        linkUrl: `${GRAFANA_PREFIX_URL}/grafana/goto/df8d6rn3p1wjkf?orgId=1`,
      },
    ],
  },
  {
    path: "/configs",
    name: "运营配置",
    icon: <AppstoreOutlined />,
    element: <ConfigOverview />,
    permission: "configs_view",
    children: [
      // {
      //   path: "/configs/role-params",
      //   name: "角色创建参数",
      //   icon: <TeamOutlined />,
      //   element: <div>角色创建参数</div>,
      //   permission: "configs_role_params_view",
      // },
      {
        path: "/configs/support",
        name: "站内支持",
        icon: <QuestionCircleOutlined />,
        element: <SupportList />,
      },
      {
        path: "/configs/image-params",
        name: "模型消耗配置",
        icon: <PictureOutlined />,
        element: <GenerateParams />,
        permission: "configs_image_params_view",
      },
      {
        path: "/configs/home-display",
        name: "首页与轮盘配置",
        icon: <PictureOutlined />,
        element: <HomeDisplayConfig />,
        permission: "configs_image_params_view",
      },
      // {
      //   path: "/configs/role-reject-reasons",
      //   name: "角色审核驳回原因",
      //   icon: <FileTextOutlined />,
      //   element: <div>角色审核驳回原因</div>,
      // },
      // {
      //   path: "/configs/chat-random-image",
      //   name: "聊天随机发图规则",
      //   icon: <PictureOutlined />,
      //   element: <div>聊天随机发图规则</div>,
      // },
      // {
      //   path: "/configs/language",
      //   name: "多语言",
      //   icon: <GlobalOutlined />,
      //   element: <LanguageConfig />,
      //   permission: "configs_i18n_view",
      // },
      // {
      //   path: "/configs/token-consume",
      //   name: "代币消耗",
      //   icon: <DollarOutlined />,
      //   element: <div>代币消耗</div>,
      //   permission: "configs_token_consume_view",
      // },
      {
        path: "/configs/membership",
        name: "会员订阅",
        icon: <CrownOutlined />,
        element: <MembershipConfig />,
        permission: "configs_membership_view",
      },
      {
        path: "/configs/coins",
        name: "代币兑换",
        icon: <SwapOutlined />,
        element: <Coins />,
        permission: "configs_coins_view",
      },
      {
        path: "/configs/gifts",
        name: "礼物",
        icon: <GiftOutlined />,
        element: <GiftsConfig />,
        permission: "configs_gifts_view",
      },
      // {
      //   path: "/configs/behaviors",
      //   name: "行为",
      //   icon: <ThunderboltOutlined />,
      //   element: <div>行为</div>,
      // },
      // {
      //   path: "/configs/intimacy",
      //   name: "亲密度",
      //   icon: <HeartOutlined />,
      //   element: <div>亲密度</div>,
      // },
      // {
      //   path: "/configs/emotions",
      //   name: "情绪",
      //   icon: <SmileOutlined />,
      //   element: <div>情绪</div>,
      // },
      // {
      //   path: "/configs/daily-tasks",
      //   name: "每日任务",
      //   icon: <CalendarOutlined />,
      //   element: <div>每日任务</div>,
      //   permission: "configs_daily_tasks_view",
      // },
      {
        path: "/configs/legal",
        name: "法律条款",
        icon: <SafetyOutlined />,
        element: <LegalConfig />,
        permission: "configs_legal_view",
      },
      // {
      //   path: "/configs/faq",
      //   name: "常见QA问题",
      //   icon: <QuestionCircleOutlined />,
      //   element: <div>常见QA问题</div>,
      // },
      // {
      //   path: "/configs/ticket-types",
      //   name: "工单问题类型",
      //   icon: <CustomerServiceOutlined />,
      //   element: <div>工单问题类型</div>,
      // },
      {
        path: "/configs/cdkey",
        name: "CD-Key",
        icon: <KeyOutlined />,
        element: <CdkeyConfig />,
      },
    ],
  },
  {
    path: "/llm-debug",
    name: "LLM 调试",
    icon: <BugOutlined />,
    children: [
      {
        path: "/llm-debug/payloads",
        name: "请求体",
        icon: <FileTextOutlined />,
        element: <LLMDebugPage />,
      },
    ],
  },
  {
    path: "/advertising",
    name: "Advertising",
    icon: <RiseOutlined />,
    permission: "configs_view",
    children: [
      {
        path: "/advertising/pixel",
        name: "Meta Pixel",
        icon: <FundOutlined />,
        element: <Pixel />,
      },
      {
        path: "/advertising/reddit-pixel",
        name: "Reddit Pixel",
        icon: <FundOutlined />,
        element: <RedditPixel />,
      },
      {
        path: "/advertising/x-pixel",
        name: "X Pixel",
        icon: <FundOutlined />,
        element: <XPixel />,
      },
    ],
  },
  // {
  //   path: "/bi-visualization",
  //   name: "BI可视化",
  //   icon: <LineChartOutlined />,
  //   permission: "configs_view",
  //   children: [
  //     {
  //       path: "/bi-visualization/llm",
  //       name: "模型接口调用",
  //       icon: <StockOutlined />,
  //       element: <LLMVisualization />,
  //     },
  //     {
  //       path: "/bi-visualization/user",
  //       name: "用户登录信息",
  //       icon: <TableOutlined />,
  //       element: <UserVisualization />,
  //     },
  //   ],
  // },
  {
    path: "/roles",
    name: "角色管理",
    icon: <TeamOutlined />,
    permission: "roles_view",
    children: [
      {
        path: "/roles/list",
        name: "角色列表",
        icon: <SignatureOutlined />,
        element: <RolesList />,
        permission: "roles_view",
      },
      {
        path: "/roles/create",
        name: "角色创建",
        icon: <IdcardOutlined />,
        element: <RolesCreate />,
        permission: "roles_create",
      },
    ],
  },
  {
    path: "/permission",
    name: "权限管理",
    icon: <FileTextOutlined />,
    permission: "permission_view",
    // element: <div>权限管理</div>,
    children: [
      {
        path: "/permission/roles",
        name: "角色管理",
        icon: <TeamOutlined />,
        element: <RolesManagement />,
        permission: "roles_view",
      },
      {
        path: "/permission/users",
        name: "用户管理",
        icon: <UserOutlined />,
        element: <UsersManagement />,
        //暂时将这个权限注释掉，后续再添加
        // permission: "users_view",
      },
    ],
  }
];

// 菜单数据类型
export interface MenuData {
  path: string;
  name: string;
  linkUrl?: string;
  icon?: React.ReactNode;
  children?: MenuData[];
}

// 根据权限过滤路由配置（保持树状结构）
export function filterRoutesByPermission(
  routeList: RouteConfig[],
  userPermissions: string[]
): RouteConfig[] {
  return routeList
    .filter((route) => {
      // 如果路由没有配置权限，保留
      if (!route.permission) {
        return true;
      }
      // 如果配置了权限，检查用户是否拥有该权限
      return userPermissions.includes(route.permission);
    })
    .map((route) => {
      // 如果有子路由，递归过滤
      if (route.children && route.children.length > 0) {
        const filteredChildren = filterRoutesByPermission(
          route.children,
          userPermissions
        );
        // 返回包含过滤后子路由的路由
        return {
          ...route,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        };
      }
      return route;
    })
    .filter((route) => {
      // 如果父路由有子路由但子路由全部被过滤掉，且父路由本身没有 element，则移除父路由
      if (route.children === undefined && !route.element) {
        return false;
      }
      return true;
    });
}

// 将路由配置转换为菜单数据（供 ProLayout 使用）
export function getMenuData(routeList: RouteConfig[] = routes): MenuData[] {
  return routeList.map(
    ({ path, name, icon, children, linkUrl }): MenuData => ({
      path,
      name,
      icon,
      linkUrl,
      children: children ? getMenuData(children) : undefined,
    })
  );
}

// 扁平化路由配置（供 react-router 使用）
export function flattenRoutes(
  routeList: RouteConfig[] = routes,
): RouteConfig[] {
  return routeList.reduce<RouteConfig[]>((acc, route) => {
    // 如果有 element，直接添加
    if (route.element) {
      acc.push(route);
    }
    // 如果没有 element 但有 children，添加一个重定向到第一个子路由的路由
    else if (route.children && route.children.length > 0) {
      // 找到第一个有 element 的子路由
      const firstChildWithElement = route.children.find(child => child.element);
      if (firstChildWithElement) {
        acc.push({
          path: route.path,
          name: route.name,
          icon: route.icon,
          element: <Navigate to={firstChildWithElement.path} replace />,
        });
      }
    }
    // 递归处理子路由
    if (route.children) {
      acc.push(...flattenRoutes(route.children));
    }
    return acc;
  }, []);
}
