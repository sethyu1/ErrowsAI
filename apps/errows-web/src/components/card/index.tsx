import React from "react";
import { HeartIcon, IntimacyIcon, HeartFilledIcon } from "@errows/icons";
import { useLike } from "@/hooks/use-like";
import { useNSFW } from "@/contexts/nsfw-context";
import { NSFWAgeConfirm } from "@/components/nsfw-age-confirm";
import { useModal } from "@/hooks/use-modal";
import { formatCompactNumber } from "@/utils/util";

interface CardProps {
  className?: string;
  style?: React.CSSProperties;
  data: API.Character.CHARACTER;
  onClick?: () => void;
  onShowNSFW?: () => void;
}

export const Card: React.FC<CardProps> = (props) => {
  const { className, style, data, onClick, onShowNSFW } = props;
  //在这里实现like逻辑
  const { liked, likesCount, handleLike } = useLike(
    data?.id,
    data?.liked ?? false,
    data?.social?.likes_count
  );
  const { nsfwEnabled, enableNSFW } = useNSFW();
  const { open: openConfirm, visible: confirmVisible, close: closeConfirm } = useModal();
  

  const isNSFW = data?.ncover != null && typeof data.ncover === 'number' && data.ncover > 0;
  const shouldShowOverlay = isNSFW && !nsfwEnabled;

  const handleShowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShowNSFW) {
      onShowNSFW();
    } else {
      openConfirm();
    }
  };

  const handleConfirm = () => {
    enableNSFW();
    closeConfirm();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (shouldShowOverlay) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <>
    <div
      className={`group relative overflow-hidden bg-gray-800 flex-shrink-0 
        rounded-[23px] max-sm:rounded-[9px]
        ${shouldShowOverlay ? 'cursor-default' : 'cursor-pointer'}
        ${className}`}
      style={{
        aspectRatio: '300/460',
        ...style,
      }}
      onClick={handleCardClick}
    >
      {/* 背景图片 */}
      <div className="relative w-full h-full">
        <img
          src={data.avatar_url}
          alt={data?.nickname}
          className={`w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-110 ${
            shouldShowOverlay ? "blur-md brightness-50" : ""
          }`}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
        />
        {/* NSFW 遮罩层 - 只显示提示文字，不显示黑色背景 */}
        {/* z-index 设置为 z-10，低于 Header 的 z-20，确保不会覆盖顶部菜单栏 */}
        {shouldShowOverlay && (
          <>
            {/* 覆盖整个卡片区域的透明遮罩层，阻止点击 */}
            <div 
              className="absolute inset-0 z-[10]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
            {/* 显示提示内容的层 */}
            <div 
              className="absolute top-0 left-0 right-0 bottom-[78px] max-sm:bottom-[46px] mx-auto flex flex-col items-center justify-center gap-2 z-[15] px-1 sm:px-0 pointer-events-none"
            >
              <div className="inline-flex flex-wrap items-center justify-center gap-1 rounded-md border border-white/30 py-1 pe-1 ps-1.5 text-sm max-sm:text-xs font-medium text-white backdrop-blur-xl backdrop-brightness-75">
                <span>This Character is rated</span>
                <div className="inline-flex items-center gap-1 border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-white/30 text-white/90 backdrop-brightness-90 rounded-sm px-1.5 py-px text-sm max-sm:text-xs bg-zinc-900/60 font-medium">
                  {data.ncover === 1 ? 'R' : data.ncover === 2 ? 'X' : 'R'}
                </div>
              </div>
              <button
                className="inline-flex items-center justify-center text-sm max-sm:text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 h-9 px-3 w-fit rounded-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:text-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 pointer-events-auto"
                onClick={handleShowClick}
              >
                Show
              </button>
            </div>
          </>
        )}
      </div>

      {/* 左上角使用次数标签 */}
      {
        <div
          className="absolute h-[20px] top-4 left-4 max-sm:top-[3px] max-sm:left-[5px] px-2 flex items-center rounded-full z-[15]"
          style={{
            background: "#4741414D",
          }}
        >
          <span
            className="text-white uppercase mr-1 text-[11.48px] "
            style={{
              fontFamily: "PingFang SC",
              fontWeight: 500,
            }}
          >
            {formatCompactNumber(data?.social?.followed_count ?? 0)}
          </span>
          <IntimacyIcon
            className="w-[13px] h-[13px]"
            style={{
              color: data?.followed ? "#D743A7" : "#fff",
            }}
          />
        </div>
      }

      {/* 底部信息栏 */}
      <div
        className="absolute rounded-[23px] max-sm:rounded-[9px] flex items-center px-[19px] max-sm:px-[7px] justify-between bottom-0 h-[78px] max-sm:h-[46px] left-0 right-0 backdrop-blur-md z-[15]"
        style={{
          // background: "rgba(0, 0, 0, 0.6)",
          background: '#4741414D'
        }}
      >
        <span
          className="text-[#E7E9EB] font-regular text-[15.31px] max-sm:text-[13px] truncate"
          style={{
            fontFamily: "PingFang SC ",
          }}
        >
          {data?.nickname}
        </span>
        <div
          className="flex items-center shrink-0 justify-center min-w-[73px] h-[39px] max-sm:min-w-[48px] max-sm:h-6 px-2 max-sm:px-1.5 rounded-lg max-sm:rounded-[4px] gap-2 ml-1"
          style={{
            background: "#FFFFFF1A",
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleLike?.();
          }}
        >
          {liked ? (
            <HeartFilledIcon className="w-5 h-5 max-sm:w-3 max-sm:h-3 shirnk-0 text-[#D743A7]" />
          ) : (
            <HeartIcon className="w-5 h-5 text-[white] max-sm:w-3 max-sm:h-3 shirnk-0" />
          )}
          <span
            className="text-[#E7E9EB] font-regular text-[15.31px] max-sm:text-[13px] leading-none"
            style={{
              fontFamily: "PingFang SC",
            }}
          >
            {formatCompactNumber(likesCount)}
          </span>
        </div>
      </div>
    </div>
    <NSFWAgeConfirm
      open={confirmVisible}
      onOpenChange={(open) => {
        if (open) {
          openConfirm();
        } else {
          closeConfirm();
        }
      }}
      onConfirm={handleConfirm}
    />
    </>
  );
};
