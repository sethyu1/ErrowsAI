import { useState, useEffect } from "react";
import PostListItem from "./components/post-list-item";
import Waterfall from "../../components/waterfall";
import { fetchPostsApi } from "@/apis/post";
import { useQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "@/components/infinite-scroll";
import { Button } from "@errows/design";
import Footer from "@/pages/home/components/footer/home.mobile.footer";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileSwiper from "./components/mobile-swiper";
import { ChatServicesProvider } from "../chat/services";
import { install } from "@/lib/install-service";
import { PostServicesProvider } from "./services";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@errows/design/components/sheet";

import PostDetailMobile from "./detail.mobile";
import { useModal } from "@/hooks/use-modal";
// 根据容器宽度和卡片宽度计算列数
const params = {
  size: 50,
};
const calculateColumnCount = (containerWidth: number) => {
  const CARD_WIDTH = 243; // 卡片宽度
  const GAP = 16; // 间距
  const MIN_COLUMNS = 1;
  const MAX_COLUMNS = 6;

  // 计算能容纳的列数: (容器宽度 + 间距) / (卡片宽度 + 间距)
  const columns = Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP));

  // 限制在最小和最大列数之间
  return containerWidth <= 640
    ? 2
    : Math.max(MIN_COLUMNS, Math.min(columns, MAX_COLUMNS));
};

const PAGE_SIZE = 12;

const PostPage = () => {
  const isMobile = useIsMobile();
  const [columnCount, setColumnCount] = useState(() =>
    calculateColumnCount(window.innerWidth)
  );
  const { t } = useTranslation();
  const { loading, count, data, query, hasMore, onLoadMore } =
    useInfiniteScroll(fetchPostsApi, params);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setColumnCount(calculateColumnCount(width));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const { data: cid, visible, open, close } = useModal<string>();
  // 根据数据量调整列数，避免列数过多导致显示异常
  const actualColumnCount = Math.min(columnCount, data?.length || 1);

  // 移动端全屏滑动模式
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col h-screen w-full overflow-hidden">
        <MobileSwiper
          items={data}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          loading={loading}
          onItemClick={(cid) => open(cid)}
        />
        <Sheet open={visible} onOpenChange={close}>
          <SheetContent side="right" className="z-1000 w-screen h-screen bg-[#101018] [&>button]:hidden">
            {cid && <PostDetailMobile cid={cid} handleBack={close} />}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // 桌面端瀑布流模式
  return (
    <div className="flex-1 flex flex-col h-screen w-full overflow-auto">
      <div className="flex flex-col items-center pt-[110px] max-sm:pt-[72px] pb-12 pl-4 pr-4 max-sm:pb-[90px]">
        {/* 瀑布流列表 */}
        <Waterfall
          items={data}
          columnCount={actualColumnCount}
          gap={12}
          // onLoadMore={onLoadMore}
          // hasMore={hasMore}
          // loading={loading}
          renderItem={(post) => <PostListItem key={post.id} data={post} />}
          className="w-full"
        />
        <div className="flex w-full justify-center pt-[48px] pb-[24px] max-sm:pt-[17px] max-sm:pb-[10px]">
          {hasMore ? (
            <Button
              appearance="gradientOutline"
              loading={loading}
              shape="round"
              onClick={onLoadMore}
            >
              {t("common.discoverMore")}
            </Button>
          ) : (
            <div className="text-[#8E8E93] text-[14px]">
              {t("common.noMoreData")}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default install(PostPage, [ChatServicesProvider, PostServicesProvider]);
