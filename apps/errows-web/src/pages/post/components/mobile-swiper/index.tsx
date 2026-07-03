import { useState, useRef, useEffect, useCallback } from "react";
import PostListItemMobileFullscreen from "../post-list-item/mobile-fullscreen";
import { Loading } from "@/components/loading";

interface MobileSwiperProps {
  items: API.POST.POST_SUMMARY[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onItemClick?: (cid: string) => void;
}

export default function MobileSwiper({
  items,
  onLoadMore,
  hasMore,
  loading,
  onItemClick,
}: MobileSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const isScrolling = useRef(false);

  // 处理滑动到下一个
  const scrollToNext = useCallback(() => {
    if (isScrolling.current) return;
    if (currentIndex < items.length - 1) {
      isScrolling.current = true;
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => {
        isScrolling.current = false;
      }, 500);
    } else if (hasMore && !loading && onLoadMore) {
      // 到达最后一个且有更多数据时加载
      onLoadMore();
    }
  }, [currentIndex, items.length, hasMore, loading, onLoadMore]);

  // 处理滑动到上一个
  const scrollToPrev = useCallback(() => {
    if (isScrolling.current) return;
    if (currentIndex > 0) {
      isScrolling.current = true;
      setCurrentIndex((prev) => prev - 1);
      setTimeout(() => {
        isScrolling.current = false;
      }, 500);
    }
  }, [currentIndex]);

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY; // 初始化为起始位置
  };

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  // 触摸结束
  const handleTouchEnd = () => {
    const deltaY = touchStartY.current - touchEndY.current;
    const threshold = 50; // 滑动阈值

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // 向上滑动 - 下一个
        scrollToNext();
      } else {
        // 向下滑动 - 上一个
        scrollToPrev();
      }
    }

    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // 鼠标滚轮支持
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 30) {
        scrollToNext();
      } else if (e.deltaY < -30) {
        scrollToPrev();
      }
    },
    [scrollToNext, scrollToPrev]
  );

  // 添加滚轮事件监听
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel]);

  // 键盘支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        scrollToNext();
      } else if (e.key === "ArrowUp") {
        scrollToPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [scrollToNext, scrollToPrev]);

  if (!items || items.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center text-[48px]">
        <Loading />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-hidden relative bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 渲染当前、上一个、下一个卡片以实现平滑过渡 */}
      {items.map((item, index) => {
        const offset = index - currentIndex;
        const isVisible = Math.abs(offset) <= 1;

        if (!isVisible) return null;

        return (
          <div
            key={item.id}
            className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out flex items-center justify-center px-0 py-15"
            style={{
              transform: `translateY(${offset * 100}%)`,
              zIndex: offset === 0 ? 10 : 1,
            }}
          >
            {/* 卡片容器 - 占满可视区域 */}
            <div className="w-full h-full max-w-[500px] mx-auto flex items-center justify-center">
              <div className="w-full h-full relative overflow-hidden">
                <PostListItemMobileFullscreen data={item} onItemClick={onItemClick} />
              </div>
            </div>
          </div>
        );
      })}

      {/* 指示器 */}
      {/* <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {items.slice(0, Math.min(items.length, 5)).map((_, index) => (
          <div
            key={index}
            className={`w-1 h-8 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-white"
                : "bg-white/30"
            }`}
          />
        ))}
        {items.length > 5 && (
          <div className="text-white/50 text-xs text-center">
            {currentIndex + 1}/{items.length}
          </div>
        )}
      </div> */}

      {/* 加载提示 */}
      {loading && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
            加载中...
          </div>
        </div>
      )}
    </div>
  );
}
