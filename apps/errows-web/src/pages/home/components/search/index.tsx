import React from "react";
import { Drawer, DrawerContent } from "@errows/design/components/drawer";
import { BackIcon, SearchIcon } from "@errows/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@errows/design";
import { useMobile } from "@/hooks/use-mobile-detector";
import { useInfiniteScroll } from "@/components/infinite-scroll";
import { fetchCharacterDiscoverListApi } from "@/apis";
import { Card } from "@/components/card";
import { Button } from "@errows/design";
import { useCharacterServices } from "@/pages/role/services";
import { useNSFW } from "@/contexts/nsfw-context";

interface SearchProps {
  visible: boolean;
  close: () => void;
}

export const Search = ({ visible, close }: SearchProps) => {
  const [searchInput, setSearchInput] = React.useState("");
  const [params, setParams] = React.useState<
    Omit<API.Character.FetchListParams, "page">
  >({
    size: 12,
    q: "",
  });
  
  // 防抖：用户停止输入 300ms 后才更新搜索参数
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setParams({
        size: 12,
        q: searchInput,
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchInput]);
  
  const isMobile = useMobile();
  const {
    data: characters,
    loading,
    onLoadMore,
    hasMore,
  } = useInfiniteScroll<API.Character.CHARACTER>(
    fetchCharacterDiscoverListApi as any,
    params
  );

  const { open } = useCharacterServices();
  const { enableNSFW } = useNSFW();
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  const handleShowNSFW = () => {
    enableNSFW();
  };

  // 键盘弹出时保持布局稳定
  React.useEffect(() => {
    if (!visible) return;

    const handleResize = () => {
      if (contentRef.current) {
        // 强制固定高度，避免键盘影响
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        contentRef.current.style.height = `${viewportHeight}px`;
      }
    };

    // 监听视口变化
    window.visualViewport?.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [visible]);

  return (
    <Drawer
      open={visible}
      onOpenChange={close}
      dismissible={false}
      direction="right"
    >
      <DrawerContent 
        ref={contentRef}
        className="data-[vaul-drawer-direction=right]:w-screen z-1000 bg-[#1b1227] flex flex-col"
        style={{ 
          height: '100vh',
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0
        }}
      >
        <div className="flex items-center h-[72px] gap-4 border-b border-[#2C2C38] pr-7 pl-5 shrink-0">
          <BackIcon className="w-5 h-5" onClick={close} />
          <InputGroup className="rounded-full">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search"
              className="h-[38px]"
              style={{ background: "none" }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </InputGroup>
        </div>
        <div className="w-full flex-1 overflow-auto px-3">
          <div
            className="grid mt-[14px] gap-4 max-sm:gap-2 w-full"
            style={{
              gridTemplateColumns: isMobile
                ? "repeat(2, 1fr)"
                : "repeat(auto-fit, minmax(300px, 1fr))",
            }}
          >
            {params.q &&
              characters?.map((item, index) => (
                <Card
                  key={index}
                  data={item}
                  onClick={() => {
                    open(item.id);
                  }}
                  onShowNSFW={handleShowNSFW}
                />
              ))}
          </div>
          {params?.q && (
            <div className="flex w-full justify-center pt-[70px] pb-[95px] max-sm:pt-[17px] max-sm:pb-[10px]">
              {hasMore ? (
                <Button
                  appearance="gradientOutline"
                  loading={loading}
                  shape="round"
                  onClick={onLoadMore}
                >
                  Discover more
                </Button>
              ) : (
                <div className="text-[#8E8E93] text-[14px]">No more data</div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
