import React, { forwardRef, useEffect, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { useIsMobile } from "@/hooks/use-mobile";
export interface CoverFlowProps {
  className?: string;
  style?: React.CSSProperties;
  /** 角色数据列表 */
  items: API.Character.CHARACTER[];

  /** 点击卡片回调 */
  onItemClick?: (character: API.Character.CHARACTER, index: number) => void;
  /** 初始选中索引 */
  initialIndex?: number;
  /** 是否显示角色信息 */
  showInfo?: boolean;
  /** 自定义卡片宽度（像素） */

  /** 卡片间距系数 */
  spacing?: number;

  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  /** 加载状态 */
  loading?: boolean;
}

export interface CoverFlowRef {
  handlePrev: () => void;
  handleNext: () => void;
}

export const CoverFlow = forwardRef<CoverFlowRef, CoverFlowProps>(
  (props, ref) => {
    const {
      items,
      onItemClick,
      currentIndex,
      setCurrentIndex,
      className,
      style,
      autoPlay = true,
      autoPlayInterval = 2000,
      loading = false,
    } = props;
    const isMobile = useIsMobile();
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleItemClick = (item: API.Character.CHARACTER) => {
      // 只有在没有拖动的情况下才触发点击
      if (!isDragging.current) {
        const index = items.findIndex((i) => i.id === item.id);
        setCurrentIndex?.(index);
        onItemClick?.(item, index);
      }
    };

    const handlePrev = () => {
      const index = (currentIndex - 1 + items.length) % items.length;
      setCurrentIndex?.(index);
    };

    const handleNext = () => {
      const index = (currentIndex + 1) % items.length;
      setCurrentIndex?.(index);
    };

    useEffect(() => {
      if (autoPlay && autoPlayInterval) {
        const timer = setInterval(() => {
          if (!isDragging.current) {
            handleNext();
          }
        }, autoPlayInterval);
        return () => clearInterval(timer);
      }
    }, [autoPlay, autoPlayInterval, handleNext]);

    // 使用 useDrag 处理拖动手势
    const bind = useDrag(
      ({
        down,
        movement: [mx, my],
        direction: [xDir],
        swipe: [swipeX],
        tap,
        last,
      }) => {

        // tap 为 true 表示是点击而非拖动
        if (tap) {
          isDragging.current = false;
          return;
        }

        // 如果正在拖动，标记状态
        if (down && Math.abs(mx) > 10) {
          isDragging.current = true;
        }

        // 拖动结束时判断是否需要切换
        if (last && !tap) {
          // 使用 swipe 检测快速滑动
          if (swipeX !== 0) {
            if (swipeX > 0) {
              // 向右快速滑动，显示上一张
              handlePrev();
            } else {
              // 向左快速滑动，显示下一张
              handleNext();
            }
          } else if (Math.abs(mx) > 50) {
            // 慢速拖动但距离足够
            if (mx > 0) {
              handlePrev();
            } else {
              handleNext();
            }
          }

          // 延迟重置拖动状态
          setTimeout(() => {
            isDragging.current = false;
          }, 100);
        }
      },
      {
        // 配置选项
        filterTaps: true, // 过滤点击事件
        swipe: {
          distance: 50, // 滑动距离阈值
          velocity: 0.5, // 滑动速度阈值
        },
      }
    );

    React.useImperativeHandle(ref, () => ({
      handlePrev,
      handleNext,
    }));

    // 计算每个卡片的渲染参数
    const getCardStyle = (itemIndex: number) => {
      if (!items || items.length === 0) return null;

      const totalItems = items.length;
      // 计算相对于 currentIndex 的偏移量（环形）
      let offset = itemIndex - currentIndex;

      // 处理环形边界
      if (offset > totalItems / 2) {
        offset -= totalItems;
      } else if (offset < -totalItems / 2) {
        offset += totalItems;
      }

      // 判断是否在中间 7 张范围内（-3 到 3）
      const isInMainRange = Math.abs(offset) <= 3;

      let translateX: number;
      let rotateY: number;
      let translateZ: number;
      let scale: number;
      let opacity: number;
      let zIndex: number;

      if (isInMainRange) {
        // 中间 7 张：按现有样式渲染
        const isCenter = offset === 0;
        translateX = offset * (isMobile ? 150 : 230);
        rotateY = isCenter ? 0 : offset > 0 ? -45 : 45;
        translateZ = isCenter ? 0 : -150;
        scale = 1 - Math.abs(offset) * 0.03;
        opacity = 1;
        zIndex = 10 + (3 - Math.abs(offset));
      } else {
        // 其余卡片：使用第三张的样式，均分到两侧
        const side = offset > 0 ? 1 : -1; // 1 为右侧，-1 为左侧
        const sideItems = Math.floor((totalItems - 7) / 2); // 每侧的额外卡片数
        const positionInSide = Math.abs(offset) - 3; // 在该侧的位置（从1开始）

        // 第三张的样式参数
        const baseTranslateX = side * 3 * (isMobile ? 150 : 230);
        const baseRotateY = side > 0 ? -45 : 45;
        const baseTranslateZ = -150;
        const baseScale = 1 - 3 * 0.03;

        translateX = baseTranslateX;
        rotateY = baseRotateY;
        translateZ = baseTranslateZ;
        scale = baseScale;
        opacity = 1;
        zIndex = 10 - positionInSide; // zIndex 递减，确保看不见
      }

      return {
        translateX,
        rotateY,
        translateZ,
        scale,
        opacity,
        zIndex,
        isInMainRange,
      };
    };
    // Loading 骨架屏
    if (loading || !items || items.length === 0) {
      return (
        <div
          className={`relative overflow-hidden w-full h-[390px] max-sm:h-[294px] flex items-center justify-center ${className}`}
          style={{
            ...style,
            perspective: "1200px",
            perspectiveOrigin: "center center",
          }}
        >
          {/* 中间主卡片骨架 */}
          <div className="w-[290px] max-sm:w-[220px] h-[390px] max-sm:h-[294px] absolute">
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-[23px] max-sm:rounded-[12px] animate-pulse" />
          </div>
          {/* 左侧卡片骨架 */}
          {[-3, -2, -1].map((offset) => (
            <div
              key={`left-${offset}`}
              className="w-[290px] max-sm:w-[220px] h-[390px] max-sm:h-[294px] absolute"
              style={{
                transform: `translateX(${offset * (isMobile ? 150 : 230)}px) translateZ(-150px) rotateY(45deg) scale(${1 - Math.abs(offset) * 0.03})`,
                transformStyle: "preserve-3d",
                opacity: 0.6,
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-[23px] max-sm:rounded-[12px] animate-pulse" />
            </div>
          ))}
          {/* 右侧卡片骨架 */}
          {[1, 2, 3].map((offset) => (
            <div
              key={`right-${offset}`}
              className="w-[290px] max-sm:w-[220px] h-[390px] max-sm:h-[294px] absolute"
              style={{
                transform: `translateX(${offset * (isMobile ? 150 : 230)}px) translateZ(-150px) rotateY(-45deg) scale(${1 - Math.abs(offset) * 0.03})`,
                transformStyle: "preserve-3d",
                opacity: 0.6,
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-[23px] max-sm:rounded-[12px] animate-pulse" />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        {...bind()}
        onDragStart={(e) => e.preventDefault()}
        className={`relative overflow-hidden w-full h-[390px] max-sm:h-[294px] flex items-center justify-center select-none ${className}`}
        style={{
          ...style,
          perspective: "1200px",
          perspectiveOrigin: "center center",
          touchAction: "pan-y", // 允许垂直滚动，阻止水平滚动的默认行为
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {items.map((item, itemIndex) => {
          const cardStyle = getCardStyle(itemIndex);
          if (!cardStyle) return null;

          const {
            translateX,
            rotateY,
            translateZ,
            scale,
            opacity,
            zIndex,
            isInMainRange,
          } = cardStyle;

          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              onDragStart={(e) => e.preventDefault()}
              className="w-[290px] max-sm:w-[220px] h-[390px] max-sm:h-[294px] flex-shrink-0 absolute left-[50%-145px] top-0 transition-[transform,opacity,rotate,scale,filter] duration-500 ease-out cursor-pointer group select-none"
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                transformStyle: "preserve-3d",
                zIndex,
                opacity,
                visibility: isInMainRange ? "visible" : "hidden",
                filter: itemIndex === currentIndex ? 'blur(0px)' : 'blur(3px)',
              }}
            >
              <div className="relative w-full h-full transition-transform duration-300 group-hover:scale-105">
                {/* 背景色容器 */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-[23px] max-sm:rounded-[12px]" />
                <img
                  src={item.avatar_url}
                  alt={item.nickname}
                  draggable={false}
                  loading="lazy"
                  className="relative w-full h-full object-cover rounded-[23px] max-sm:rounded-[12px] transition-all duration-300 group-hover:shadow-2xl pointer-events-none"
                  style={{
                    backfaceVisibility: "hidden",
                    userSelect: "none",
                  }}
                />
                {/* Hover 遮罩层 */}
                {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[23px] pointer-events-none" /> */}
                {/* Hover 信息显示 */}
                {/* <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white font-semibold text-lg drop-shadow-lg">{item.nickname}</p>
              </div> */}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
