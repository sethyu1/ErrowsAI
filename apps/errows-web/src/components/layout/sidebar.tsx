import React from "react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { MagicIcon } from "@errows/icons";
import QuickEntry from "./quick-entry";
import { toast } from "sonner";
import { items, actions } from "./sidebar-config";
import { Social } from "./components/social";
import { useAuthStore } from "@/stores/auth";
import { useShallow } from "zustand/react/shallow";
import { useGlobalStore } from "@/stores/global";
import { Tooltip, TooltipTrigger, TooltipContent } from "@errows/design";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { CloseIcon, MenuIcon } from "@errows/icons";
import { useSupportDialog } from "@/stores/support";

const useEnery = () => {
  const [openQuick, setOpenQuick] = React.useState(false);
  //@ts-ignore
  const timer = React.useRef<NodeJS.Timeout | null>(null);
  const handleMouseEntry = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    setOpenQuick(true);
  };

  const handleMouseLeave = () => {
    timer.current = setTimeout(() => {
      setOpenQuick(false);
    }, 400);
  };
  return {
    openQuick,
    setOpenQuick,
    handleMouseEntry,
    handleMouseLeave,
  };
};

export const Sidebar = () => {
  const { t } = useTranslation();
  const [expand, setExpand] = React.useState(false);
  // const [openQuick, setOpenQuick] = React.useState(false);
  const magicRef = React.useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
    }))
  );
  const setOpenAuth = useGlobalStore.getState().setOpenAuth;
  const isLogin = Boolean(token);
  const { isInstallable, installPWA } = usePWAInstall();
  const { openDialog: openSupportDialog } = useSupportDialog();
  // 判断当前路由是否匹配
  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const handleItemClick = (path: string) => {
    if (!isLogin && path !== "/") {
      setOpenAuth(true, "login");
      return;
    }
    navigate(path);
    setExpand(false);
  };

  const handleAction = async (key: string) => {
    setExpand(false);
    switch (key) {
      case "support":
        openSupportDialog();
        break;
      case "about-us":
        navigate("/about-us");
        break;
      case "install-app":
        if (!isInstallable) {
          toast.error("PWA is not available or already installed");
          return;
        }
        const result = await installPWA();
        if (result.success) {
          toast.success("App installed successfully!");
        } else {
          toast.error(result.message);
        }
        break;
      case "become-affiliate":
        toast.success(t("common.comingSoon"));
        break;
    }
  };

  const { openQuick, setOpenQuick, handleMouseEntry, handleMouseLeave } =
    useEnery();

  return (
    <div className="max-sm:hidden bg-[#0E0F17] w-20 h-full relative">
      <div
        className={`absolute top-0 left-0 h-full flex flex-col cursor-pointer ${
          expand ? "w-60" : "w-20"
        } z-999 border-r border-[#2C2C38] scrollbar-hide`}
        style={{
          background:
            "linear-gradient(180deg, rgba(14, 15, 23, 0.752) 0%, rgba(14, 15, 23, 0.94) 37.21%)",
          paddingTop: "17px",
          paddingBottom: "20px",
          backdropFilter: "blur(27px)",
          transition: "all 0.2s ease-in-out",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        <div
          className="w-12 h-12 ml-4 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => setExpand(!expand)}
        >
          {expand ? (
            <CloseIcon className="size-5" />
          ) : (
            <MenuIcon className="size-5" />
          )}
        </div>

        {/* 工具图标组 */}
        <div className="flex flex-col mt-4 cursor-pointer gap-1">
          {items.map((item) => {
            const active = isActive(item.path);

            return (
              <Tooltip key={item.titleKey}>
                <TooltipTrigger asChild>
                  <div
                    key={item.path}
                    className={`flex items-center ${
                      expand && "hover:bg-white/10"
                    } ${
                      expand && active && "bg-white/10"
                    } rounded-lg transition-all`}
                    onClick={() => handleItemClick(item.path)}
                  >
                    <div
                      className={`h-12 w-12 ml-4 flex items-center justify-center ${
                        !expand && "hover:bg-white/10"
                      } ${
                        !expand && active && "bg-white/10"
                      } rounded-lg transition-all`}
                      style={{
                        flexShrink: 0,
                      }}
                    >
                      <item.icon
                        className="size-[22px]"
                        color={active ? "#FFFFFF" : "#A1A8A8"}
                      />
                    </div>
                    {expand && (
                      <span
                        style={{
                          fontFamily: "Urbanist",
                          fontWeight: active ? 800 : 700,
                          fontSize: active ? "15px" : "14px",
                          lineHeight: "22px",
                          letterSpacing: "0%",
                          color: active ? "#FFFFFF" : "#A1A8A8",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}
                      >
                        {t(item.titleKey)}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t(item.titleKey)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* 中央大按钮 */}
        <div
          ref={magicRef}
          onMouseEnter={handleMouseEntry}
          onMouseLeave={handleMouseLeave}
          className={`size-14 shrink-0 ml-3 flex items-center justify-center mt-16 cursor-pointer hover:bg-white/10 rounded-lg transition-all relative group`}
          style={{
            background: "linear-gradient(180deg, #D9D9D9 0%, #D6B8D4 100%)",
            boxShadow: "0px 0px 4px 0px #FFFFFF40 inset",
            borderRadius: `${expand ? "56px" : "50%"}`,
            transition: "all 0.3s ease-in-out",
            width: `${expand ? "208px" : "56px"}`,
          }}
        >
          <MagicIcon className="text-[rgba(18,17,26,1)]" />
          {expand && (
            <span className="font-urbanist ml-1 font-bold text-[14px] text-[#12111A]">
              Create
            </span>
          )}

          {/* 快捷入口浮层（PC） */}
          <QuickEntry
            open={openQuick}
            onClose={() => setOpenQuick(false)}
            anchorRect={
              magicRef.current ? magicRef.current.getBoundingClientRect() : null
            }
            sidebarWidth={expand ? 240 : 80}
            onMouseEnter={handleMouseEntry}
            onMouseLeave={handleMouseLeave}
          />
        </div>

        {/* 弹性空间 */}
        <div className="flex-1"></div>

        {/* 底部图标组 */}
        <div className="flex flex-col mt-4 cursor-pointer">
          {actions.map((item) => {
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => handleAction(item.key)}
                    className={`flex items-center ${
                      expand && "hover:bg-white/10"
                    } rounded-lg transition-all`}
                  >
                    <div
                      className={`h-12 w-12 ml-4 flex items-center justify-center ${
                        !expand && "hover:bg-white/10"
                      } rounded-lg transition-all`}
                      style={{
                        flexShrink: 0,
                      }}
                    >
                      <item.icon className="size-[22px]" color={"#A1A8A8"} />
                    </div>
                    {expand && (
                      <span
                        style={{
                          fontFamily: "Urbanist",
                          fontWeight: 700,
                          fontSize: 14,
                          lineHeight: "22px",
                          letterSpacing: 0,
                          color: "#A1A8A8",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                        }}
                      >
                        {t(item.titleKey)}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t(item.titleKey)}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* 分割线 */}
        <div
          className="w-full h-px my-[21px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(217, 217, 217, 0) 0%, rgba(217, 217, 217, 0.6) 50%, rgba(217, 217, 217, 0) 100%)",
          }}
        />
        {/* 社交媒体图标 */}
        <div className={`w-full flex flex-wrap gap-2 h-12 mb-2 px-3 items-center justify-around`}>
          <Social className="size-5 text-[#C1C7D0] flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};
