import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { items, bottomItems } from "./sidebar-config";
import QuickEntry from "./quick-entry";
import { TEXT_GRADUAL_STYLE } from "@/config/style";
import { useTranslation } from "react-i18next";
import { MagicIcon, ExhaleIcon } from "@errows/icons";
import { useAutoHide } from "@/hooks/use-auto-hide";
// 主渐变色
const MAIN_GRADIENT =
  "linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)";

export const Bottom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openQuick, setOpenQuick] = React.useState(false);
  const { t } = useTranslation();
      // 监听路径变化，关闭快捷入口
      const prevPathnameRef = React.useRef(location.pathname);

  // Auto-hide on scroll
  const { isVisible, setIsVisible } = useAutoHide({
    enabled: location.pathname === "/",
    scrollThreshold: 50,
    showDelay: 3000,
    scrollContainerId: "home-scroll-container",
    defaultVisible: false,
    autoShow: false,
  });
  // const [isVisible, setIsVisible] = useState(false);

  // 判断当前路由是否匹配
  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

    React.useEffect(() => {
      if (prevPathnameRef.current !== location.pathname) {
        setOpenQuick(false);
        prevPathnameRef.current = location.pathname;
      }
    }, [location.pathname, setOpenQuick]);
  

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-998 h-15 bg-[#0E0F17] border-t border-[#2C2C38]"
        style={{
          background:
            "linear-gradient(180deg, rgba(14, 15, 23, 0.95) 0%, rgba(14, 15, 23, 0.98) 100%)",
          backdropFilter: "blur(20px)",
          // transform:
          //   location.pathname === "/"
          //     ? `translateY(${isVisible ? "0" : "100%"})`
          //     : undefined,
          transform: `translateY(${isVisible ? "0" : "100%"})`,
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <div className="flex items-center justify-between h-full px-4">
          {/* 导航项 */}
          <div className="flex items-center justify-around flex-1">
            {bottomItems.map((item) => {
              const active = isActive(item.path);
              return (
                <div
                  key={item.path}
                  className="flex flex-col items-center justify-center gap-1 cursor-pointer"
                  onClick={() => navigate(item.path)}
                >
                  <div className="w-6 h-6 flex items-center justify-center rounded-lg transition-all">
                    {active ? (
                      <item.activeIcon />
                    ) : (
                      <item.icon color="#A1A8A8" />
                    )}
                  </div>
                  <span
                    className="text-[11px] font-medium"
                    style={{
                      color: active ? "#FFFFFF" : "#A1A8A8",
                      fontFamily: "Urbanist",
                      transition: "all 0.2s ease-in-out",
                    }}
                  >
                    {t(item.titleKey)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Magic 按钮 */}
          <div
            className="w-[48px] h-[48px] flex items-center justify-center cursor-pointer transition-all shrink-0 ml-2"
            style={{
              background: "linear-gradient(180deg, #D9D9D9 0%, #D6B8D4 100%)",
              boxShadow: "0px 0px 4px 0px #FFFFFF40 inset",
              borderRadius: "50%",
            }}
            onClick={() => setOpenQuick((v) => !v)}
          >
            {/* <i className="iconfont icon-a-Vector7 text-black text-[20px]"></i> */}
            <MagicIcon className="text-black text-[20px]" />
          </div>
        </div>

        {/* 快捷入口浮层（移动端）: 底部导航高度 90px + 8px */}
        <QuickEntry
          open={openQuick}
          onClose={() => setOpenQuick(false)}
          mobileBottomOffset={64}
        />
      </div>
      {!isVisible && (
        <div className="fixed size-8 z-999 bottom-3 right-2 flex items-center justify-center cursor-pointer" onClick={() => setIsVisible(true)}>
          <div className="size-8 flex items-center justify-center border border-[#D9D9D9] rounded-full backdrop-blur-[4px]">
            <ExhaleIcon className="text-[#D9D9D9] text-[12px]" />
          </div>
        </div>
      )}
    </>
  );
};
