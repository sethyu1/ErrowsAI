import type { ReactNode } from "react";
import { LoadingTrigger } from "./LoadingTrigger";
import React from "react";
import { useTranslation } from "react-i18next";
import useGetState from "@/hooks/use-get-state";
import { race } from "@/lib/race";

export type ScrollDirection = "down" | "up" | "both";

export interface InfiniteScrollProps {
  children: ReactNode;
  direction?: ScrollDirection;

  // 下拉加载配置
  onLoadMore?: () => void | Promise<void>;
  loading?: boolean;
  hasMore?: boolean;

  // 上拉加载配置
  onLoadPrevious?: () => void | Promise<void>;
  loadingPrevious?: boolean;
  hasPrevious?: boolean;

  // 触发器配置
  threshold?: number;
  loadingText?: string;
  loadingPreviousText?: string;
  noMoreText?: string;
  noPreviousText?: string;

  // 容器配置
  className?: string;
  containerClassName?: string;
}

/**
 * 无限滚动组件
 * 支持向下滚动加载更多（底部）和向上滚动加载更多（顶部）
 *
 * @example
 * // 向下滚动加载
 * <InfiniteScroll
 *   direction="down"
 *   onLoadMore={loadMore}
 *   loading={loading}
 *   hasMore={hasMore}
 * >
 *   {items.map(item => <div key={item.id}>{item.name}</div>)}
 * </InfiniteScroll>
 *
 * @example
 * // 双向滚动加载
 * <InfiniteScroll
 *   direction="both"
 *   onLoadMore={loadNext}
 *   loading={loadingNext}
 *   hasMore={hasNext}
 *   onLoadPrevious={loadPrev}
 *   loadingPrevious={loadingPrev}
 *   hasPrevious={hasPrev}
 * >
 *   {items.map(item => <div key={item.id}>{item.name}</div>)}
 * </InfiniteScroll>
 */
export function InfiniteScroll({
  children,
  direction = "down",
  onLoadMore,
  loading = false,
  hasMore = true,
  onLoadPrevious,
  loadingPrevious = false,
  hasPrevious = true,
  threshold = 0.1,
  loadingText,
  loadingPreviousText,
  noMoreText,
  noPreviousText,
  className = "",
  containerClassName = "",
}: InfiniteScrollProps) {
  const { t } = useTranslation();
  
  // 使用翻译作为默认值
  const finalLoadingText = loadingText ?? t("common.loading");
  const finalLoadingPreviousText = loadingPreviousText ?? t("common.loading");
  const finalNoMoreText = noMoreText ?? t("common.noMoreData");
  const finalNoPreviousText = noPreviousText ?? t("common.noMoreData");
  const showTopTrigger =
    (direction === "up" || direction === "both") && onLoadPrevious;
  const showBottomTrigger =
    (direction === "down" || direction === "both") && onLoadMore;
  return (
    <div className={`infinite-scroll-container ${containerClassName}`}>
      {showTopTrigger && (
        <LoadingTrigger
          onLoadMore={onLoadPrevious}
          loading={loadingPrevious}
          hasMore={hasPrevious}
          threshold={threshold}
          loadingText={finalLoadingPreviousText}
          noMoreText={finalNoPreviousText}
          className="top-trigger"
        />
      )}

      <div className={className}>{children}</div>

      {showBottomTrigger && (
        <LoadingTrigger
          onLoadMore={onLoadMore}
          loading={loading}
          hasMore={hasMore}
          threshold={threshold}
          loadingText={finalLoadingText}
          noMoreText={finalNoMoreText}
          className="bottom-trigger"
        />
      )}
    </div>
  );
}

type FetchQuery = {
  page: number;
  size: number;
  sort?: string;
  q?: string; // 搜索关键词
  [key: string]: any;
};

type FetchFunction<T> = (
  query: FetchQuery
) => Promise<{ count: number; data: T[] }>;

/*
  现在只支持下拉加载更多
*/

//这里需要对fetchFunction进行优化，一个是保证其流量防抖，第二个是要保证最后一个请求必定执行
//以便应对各种极限情况，比如用户疯狂下拉，搜索这几类场景

export const useInfiniteScroll = <T extends any>(
  fetchFunction: FetchFunction<T>,
  defaultQuery?: Partial<FetchQuery>
) => {
  const [loading, setLoading, getLoading] = useGetState(false);
  const [count, setCount, getCount] = useGetState(0);
  const alreadyLoading = React.useRef(0);
  const [data, setData] = React.useState<T[]>([]);
  const [query, setQuery] = React.useState<FetchQuery>({
    ...defaultQuery,
    size: defaultQuery?.size || 10,
    page: defaultQuery?.page || 0,
  });

  //暂时以-10作为取消请求的标志
  const raceFetch = React.useMemo(
    () => race(fetchFunction, { count: -10, data: [] }),
    []
  );

  // 请求版本号，用于确保只处理最新请求的响应
  const requestVersionRef = React.useRef(0);

  React.useEffect(() => {
    setCount(0);
    setData([]);
    alreadyLoading.current = 0;
    // 重置时增加版本号，让旧请求失效
    requestVersionRef.current += 1;
    setQuery({
      ...defaultQuery,
      size: defaultQuery?.size || 10,
      page: 0,
    });
  }, [
    defaultQuery?.size,
    defaultQuery?.sort,
    defaultQuery?.q,
    defaultQuery?.tags,
    (defaultQuery as any)?.refreshTrigger,
  ]);

  const hasMore = React.useMemo(() => {
    return count > data?.length;
  }, [data, count]);

  React.useEffect(() => {
    // 使用 ref 同步检查，立即生效
    if (getLoading()) {
      // console.log("请求进行中，跳过");
      return;
    }

    if (!(getCount() > alreadyLoading.current || getCount() === 0)) {
      // console.log("没有更多数据，跳过");
      return;
    }

    setLoading(true);

    // 捕获当前请求的版本号
    // const currentRequestVersion = requestVersionRef.current;

    (async () => {
      try {
        const { count, data } = await fetchFunction(query);
        // 检查请求版本号，如果不是最新的，直接丢弃结果
        // if (currentRequestVersion !== requestVersionRef.current) {
        //   //请求已经过期
        //   return;
        // }

        if (count === -10) {
          // console.log("取消请求==>>");
          return;
        }

        setCount(count);
        alreadyLoading.current += data?.length;
        setData((prev) => [...prev, ...data]);
        setLoading(false);
      } catch (error) {
        console.error(error);
      } finally {
      }
    })();
  }, [query]);

  const onLoadMore = React.useCallback(() => {
    if (
      (!getLoading() && getCount() > alreadyLoading.current) ||
      getCount() === 0
    ) {
      setQuery((prev) => ({
        ...prev,
        page: prev.page + 1,
      }));
    }
  }, [data?.length]);
  return {
    loading,
    count,
    data,
    query,
    hasMore: hasMore || loading,
    setData,
    onLoadMore,
  };
};
