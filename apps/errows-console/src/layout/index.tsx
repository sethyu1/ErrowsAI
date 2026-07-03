import { Outlet, useNavigate, useLocation } from "react-router";
import { ProLayout, PageContainer } from "@ant-design/pro-components";
import { LogoutOutlined, SunOutlined, MoonOutlined } from "@ant-design/icons";
import {
  Dropdown,
  message,
  ConfigProvider,
  theme,
  Button,
  Tooltip,
} from "antd";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { useShallow } from "zustand/react/shallow";
import { getMenuData, routes, filterRoutesByPermission } from "../routes";
import { TOKEN_KEY } from "@/constants";
import { BreadcrumbNav } from "@/components";
import { usePermission } from "@/hooks/permission";
import { useEffect, useMemo } from "react";

const BasicLayout = () => {
  const { userPermissions, userProfile } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const menuData = useMemo(() => {
    const filteredRouters = filterRoutesByPermission(routes, userPermissions);
    return getMenuData(filteredRouters);
  }, [userPermissions]);
  const { setToken, setUser } = useAuthStore(
    useShallow((state) => ({
      setUser: state.setUser,
      setToken: state.setToken,
    }))
  );
  const { isDark, setIsDark } = useThemeStore(
    useShallow((state) => ({
      isDark: state.isDark,
      setIsDark: state.setIsDark,
    }))
  );

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('errows.console.user.name');
    setToken("");
    setUser(null);
    message.success("已退出登录");
    navigate("/login");
  };

  const avatarDropdownItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout,
    },
  ];

  useEffect(() => {
    if (userProfile?.data) {
      setUser(userProfile.data as any);
    }
  }, [userProfile?.data])

  return (
    <ConfigProvider
      theme={{
        cssVar: false,
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1890ff",
        },
      }}
    >
      <ProLayout
        title="Errows Console"
        logo="/logo.png"
        layout="mix"
        fixedHeader
        fixSiderbar
        token={{
          header: {
            colorBgHeader: isDark ? "#141414" : "#fff",
            colorTextMenu: isDark
              ? "rgba(255,255,255,0.85)"
              : "rgba(0,0,0,0.85)",
            colorTextMenuSecondary: isDark
              ? "rgba(255,255,255,0.65)"
              : "rgba(0,0,0,0.65)",
            colorTextMenuSelected: isDark ? "#fff" : "#1890ff",
            colorBgMenuItemSelected: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(24,144,255,0.1)",
            colorTextMenuActive: isDark ? "#fff" : "#1890ff",
            colorTextRightActionsItem: isDark
              ? "rgba(255,255,255,0.85)"
              : "rgba(0,0,0,0.85)",
          },
          sider: {
            colorMenuBackground: isDark ? "#141414" : "#fff",
            colorTextMenu: isDark
              ? "rgba(255,255,255,0.85)"
              : "rgba(0,0,0,0.85)",
            colorTextMenuSelected: isDark ? "#fff" : "#1890ff",
            colorBgMenuItemSelected: isDark
              ? "rgba(24,144,255,0.3)"
              : "rgba(24,144,255,0.1)",
            colorTextMenuActive: isDark ? "#fff" : "#1890ff",
          },
          pageContainer: {
            colorBgPageContainer: isDark ? "#000" : "#f0f2f5",
          },
        }}
        location={{ pathname: location.pathname }}
        route={{
          path: "/",
          children: menuData,
        }}
        menuItemRender={(item, dom) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={() =>{
            console.log(item);
            if(item.linkUrl) {
              window.open(item.linkUrl, '_blank');
            } else if(item.path) {
              navigate(item.path)
            }
          }}>
            {item.icon}
            {dom}
          </div>
        )}
        avatarProps={{
          src: "https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png",
          size: "small",
          title: userProfile.data?.name ?? "Admin",
          render: (_, dom) => (
            <Dropdown
              menu={{ items: avatarDropdownItems }}
              placement="bottomRight"
            >
              {dom}
            </Dropdown>
          ),
        }}
        actionsRender={() => [
          <Tooltip
            key="theme"
            title={isDark ? "切换到浅色模式" : "切换到深色模式"}
          >
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={() => setIsDark(!isDark)}
              style={{
                fontSize: 18,
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)",
              }}
            />
          </Tooltip>,
        ]}
        headerTitleRender={(logo, title) => (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {logo}
            {title}
          </div>
        )}
        menuFooterRender={(props) => {
          if (props?.collapsed) return undefined;
          return (
            <div style={{ textAlign: "center", paddingBlockStart: 12 }}>
              <div>© 2024 Errows</div>
            </div>
          );
        }}
      >
        <PageContainer
          breadcrumbRender={false}
          header={{
            title: false,
          }}
          prefixCls="errows-console"
          style={{ paddingTop: 0 }}
        >
          <div style={{ marginBottom: 16 }}>
            <BreadcrumbNav />
          </div>
          <Outlet />
        </PageContainer>
      </ProLayout>
    </ConfigProvider>
  );
};

export default BasicLayout;
