import { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useShallow } from 'zustand/react/shallow';
import { Sidebar } from "./sidebar";
import { useAuthStore } from '@/stores/auth';
import { useMemberInfo } from '@/services/member'
import { Header } from "./header";
import { Bottom } from "./bottom";
import { MobileSidebar } from "./mobile";
import { useIsMobile } from "@/hooks/use-mobile";

const hideLayoutPaths = ["/role/create", "/generate/image", "/generate/video", "/multimedia/info"];

export const Layout = () => {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const [openMobileSidebar, setOpenMobileSidebar] = useState(false);
  const { token } = useAuthStore(useShallow((state) => ({
    token: state.token,
  })));
  useMemberInfo(!!token);
  const hideLayout = useMemo(() => {
    return isMobile && hideLayoutPaths.some((path) => pathname.includes(path));
  }, [pathname, isMobile]);

  return (
    <div className="flex h-screen w-screen">
      {!hideLayout && (
        <Header
          className="absolute top-0 left-0 right-0 z-20"
          onOpenMobileSidebar={setOpenMobileSidebar}
        />
      )}
      {!hideLayout && <Sidebar />}
      <div
        className={`relative flex max-h-screen max-w-screen w-screen h-screen pb-0 ${hideLayout ? '' : pathname !== '/' ? 'max-sm:pb-[90px]' : ''}`}
        style={{
          background: "linear-gradient(180deg, #0A0A0F 0%, #15151E 100%)",
          ...(hideLayoutPaths.some((path) => pathname.includes(path))
            ? { overflow: "auto" }
            : {}),
        }}
      >
        <Outlet />
      </div>
      {!hideLayout && isMobile && <Bottom />}

      <MobileSidebar
        open={openMobileSidebar}
        onOpenChange={setOpenMobileSidebar}
      />
    </div>
  );
};
