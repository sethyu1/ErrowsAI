import { Suspense, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Spin, ConfigProvider } from "antd";
import Login from "./pages/login";
import BasicLayout from "./layout";
import { flattenRoutes, routes } from "./routes";
import zhCN from "antd/locale/zh_CN";
import { connect, usePermission } from "@/hooks/permission";
import "./App.css";

function App() {
  const { userPermissions } = usePermission();
  const routeList = useMemo(() => {
    const flatRoutes = flattenRoutes(routes);
    return flatRoutes.filter((route) => {
      return !route.permission || userPermissions.includes(route.permission);
    });
  }, [userPermissions]);
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        cssVar: false,
        hashed: false,
      }}
    >
      <BrowserRouter>
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
              }}
            >
              <Spin size="large" />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={<BasicLayout />}
            >
              <Route path="/dashboard" element={<Navigate to="/configs/membership" replace />} />
              {routeList.map((route) => (
                <Route
                  key={route.path}
                  path={route.path.replace(/^\//, "")}
                  element={route.element}
                />
              ))}
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default connect(App);
