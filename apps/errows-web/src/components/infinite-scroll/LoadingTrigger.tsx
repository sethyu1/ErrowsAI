import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export interface LoadingTriggerProps {
  onLoadMore: () => void | Promise<void>;
  loading?: boolean;
  hasMore?: boolean;
  threshold?: number;
  loadingText?: string;
  noMoreText?: string;
  className?: string;
}

/**
 * 加载触发器组件
 * 使用 Intersection Observer 监听组件是否进入视口，触发加载更多
 */
export function LoadingTrigger({
  onLoadMore,
  loading = false,
  hasMore = true,
  threshold = 0.1,
  loadingText = "Loading...",
  noMoreText = "No more data",
  className = "",
}: LoadingTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // 如果正在加载或没有更多数据，不创建观察器
    if (loading || !hasMore) {
      return;
    }

    const trigger = triggerRef.current;
    if (!trigger) return;

    // 创建 Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // 当元素进入视口时触发加载
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      {
        threshold,
        rootMargin: "0px",
      }
    );

    observerRef.current.observe(trigger);

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, threshold, onLoadMore]);

  return (
    <div
      ref={triggerRef}
      className={`flex items-center justify-center py-4 ${className}`}
    >
      {loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{loadingText}</span>
        </div>
      )}
      {!loading && !hasMore && (
        <div className="text-gray-400 text-sm">{noMoreText}</div>
      )}
      {!loading && hasMore && (
        <div className="text-gray-400 text-sm">Infinite scrolling for more</div>
      )}
    </div>
  );
}
