import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { MagicWandIcon, NImageIcon, FilmFilledIcon } from "@errows/icons";
import { useMobile } from "@/hooks/use-mobile-detector";
// import { RoleSelector } from "@/components";
import type { RoleSelectorRef } from "@/components";
import { cn } from "@errows/design/lib/utils";

type QuickEntryProps = {
  open: boolean;
  onClose: () => void;
  /**
   * PC 端用于对齐的 Magic 按钮 DOMRect 数据。
   * 提供后组件会将卡片的垂直中心与该按钮中心对齐。
   */
  anchorRect?: DOMRect | null;
  /**
   * 移动端：底部偏移（通常为底部导航高度+8px）
   */
  mobileBottomOffset?: number;
  /**
   * PC 端：侧边栏宽度（用于计算距离右侧 8px 的 left 值）
   */
  sidebarWidth?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  
};

const EntryConfigs = [
  { labelKey: "sidebar.character", Icon: MagicWandIcon, to: "/role/create" },
  {
    labelKey: "sidebar.image",
    Icon: NImageIcon,
    to: '/generate/image'
  },
  {
    labelKey: "sidebar.video",
    Icon: FilmFilledIcon,
    to: '/generate/video'
  },
];

/**
 * 快捷入口弹层（支持移动端/PC 不同布局）。
 * - 点击遮罩关闭
 * - 按 Esc 关闭
 * - 四个卡片跳转不同路由
 */
export const QuickEntry: React.FC<QuickEntryProps> = ({
  open,
  onClose,
  anchorRect,
  mobileBottomOffset = 98,
  sidebarWidth = 80,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { t } = useTranslation();
  const isMobile = useMobile();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);


  const cardWidth = isMobile ? 0 : 322; // 仅用于 PC 对齐
  const cardHeight = isMobile ? 138 : 153;

  // 计算定位
  const style: React.CSSProperties = isMobile
    ? {
      left: 8,
      right: 8,
      top: 'auto',
      bottom: mobileBottomOffset,
      height: cardHeight,
      zIndex: 1000,
    }
    : {
      left: sidebarWidth + 8,
      top: anchorRect
        ? Math.round(anchorRect.top + anchorRect.height / 2 - cardHeight / 2)
        : 322,
      width: cardWidth,
      height: cardHeight,
      zIndex: 1000,
    };

  const goto = (path: string) => {
    navigate(path);
    onClose();
  };

  const content = (
    <div
      className={cn("fixed inset-0 z-999 rounded-[16px]",
        isMobile
          ? "border border-white/10 backdrop-blur-[6px]"
          : "")
      }
      style={{
        ...style,
        background: isMobile ? "rgba(30, 26, 39, 1)" : "#2C203F",
        opacity: isMobile ? 1 : 0.9,
        backdropFilter: isMobile ? "blur(15px)" : "blur(40px)",
        display: open ? 'block' : 'none'
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* 内部布局：统一使用 flex */}
      {isMobile ? (
        <div className="flex items-stretch justify-center p-2 ">
          {EntryConfigs.map(({ labelKey, Icon, to }) => (
            <button
              key={labelKey}
              className="flex flex-col items-center justify-between rounded-[7.23px] bg-[rgba(9, 10, 10, 0.4)] text-white cursor-pointer"
              style={{ width: "50%", height: 108.378 }}
              onClick={() => {
                if (to) goto(to);
              }}
            >
              <div
                className="mt-8 flex items-center justify-center"
                style={{ width: 24.084, height: 24.084 }}
              >
                <Icon color="#FFFFFF" />
              </div>
              <div className="mb-[18px] text-center text-[12.64px] leading-[19.87px] font-bold font-urbanist">
                {t(labelKey)}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="w-full h-[153px] p-4 flex items-stretch justify-between gap-2.5">
          {EntryConfigs.map(({ labelKey, Icon, to }) => (
            <button
              key={labelKey}
              className="flex flex-col flex-1 items-center justify-center rounded-[12px] text-white cursor-pointer"
              style={{
                width: 90,
                height: 120,
                backgroundColor: "rgba(9, 10, 10, 0.2)",
              }}
              onClick={() => {
                if (to) goto(to);
              }}
            >
              <div
                className="mb-5 flex items-center justify-center"
                style={{ width: 29.333, height: 28 }}
              >
                <Icon color="#FFFFFF" />
              </div>
              <div className="text-[13px] text-white leading-[20px] font-bold font-urbanist">
                {t(labelKey)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};

export default QuickEntry;
