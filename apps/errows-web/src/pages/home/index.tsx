import { Card } from "../../components/card";
import Footer from "./components/footer/home.mobile.footer";
import { Banner } from "./components/banner";
import { useMobile } from "@/hooks/use-mobile-detector";
import { CarouselEx } from "../../components/carousel-ex";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  InputGroupInput,
  InputGroupAddon,
  InputGroup,
} from "@errows/design";
import { ArrowRightFillIcon, SearchIcon } from "@errows/icons";
import { install } from "@/lib/install-service";
import {
  CharacterServicesProvider,
  useCharacterServices,
} from "@/pages/role/services";
import { fetchCharacterDiscoverListApi, fetchHomeDisplayConfigApi, fetchCharacterDetailApi } from "@/apis";
import { useInfiniteScroll } from "@/components/infinite-scroll";
import { HomeServicesProvider } from "./services";
import { useHomeServices } from "./services/use-home-services";
import { useState, useEffect, useRef, useMemo } from "react";
import { Search } from "./components/search";
import { useNSFW } from "@/contexts/nsfw-context";
import { useAuthStore } from "@/stores/auth";
import { useMemberInfo } from "@/services/member";
import { useShallow } from "zustand/react/shallow";
import { useGlobalServer } from "@/hooks/use-global-server";
import { useModal } from "@/hooks/use-modal";
// import banner1 from "./assets/banner1.jpg";
// import banner2 from "./assets/banner2.jpg";
// import banner3 from "./assets/banner3.jpg";
// import banner4 from "./assets/banner4.jpg";
const BANNER_URL = "https://butter1.s3.us-east-1.amazonaws.com/banner.webp";

const useHomeDisplay = () => {
  const [config, setConfig] = useState<Awaited<ReturnType<typeof fetchHomeDisplayConfigApi>> | null>(null);
  const [carouselCharacters, setCarouselCharacters] = useState<API.Character.CHARACTER[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const c = await fetchHomeDisplayConfigApi();
        setConfig(c ?? null);
      } catch {
        setConfig(null);
      }
    })();
  }, []);
  useEffect(() => {
    const rawSlots = config?.carousel?.slots ?? [];
    const slots = [...rawSlots].sort((a, b) => {
      const oa = a.order != null && Number.isFinite(Number(a.order)) ? Number(a.order) : 999999;
      const ob = b.order != null && Number.isFinite(Number(b.order)) ? Number(b.order) : 999999;
      return oa - ob;
    });
    if (slots.length === 0) {
      setCarouselCharacters([]);
      return;
    }
    let cancelled = false;
    setCarouselLoading(true);
    (async () => {
      try {
        const list = await Promise.all(
          slots.map(async (slot) => {
            try {
              const char = await fetchCharacterDetailApi(slot.character_id);
              return char ? { ...char, avatar_url: slot.image_url || char.avatar_url } : null;
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) setCarouselCharacters(list.filter((c): c is API.Character.CHARACTER => c != null));
      } finally {
        if (!cancelled) setCarouselLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [config?.carousel?.slots]);
  return { config, carouselCharacters, carouselLoading };
};
import { useTranslation } from "react-i18next";
import { emitter } from "@/hooks/use-self-follow";
import { BaseContainer } from "@/components/base-container";

// sort
// 'popular' | 'newest' | 'most_liked' | 'alphabetical' | 'latest' | 'created_at'
const getSortOptions = (t: any) => [
  { label: t("role.selector.sortDefault"), value: "default" },
  { label: t("role.selector.sortPopular"), value: "popular" },
  { label: t("role.selector.sortNewest"), value: "newest" },
  { label: t("role.selector.sortMostLiked"), value: "most_liked" },
  { label: t("role.selector.sortAlphabetical"), value: "alphabetical" },
];

const useRecommended = () => {
  const [characters, setCharacters] = useState<API.Character.CHARACTER[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetchCharacterDiscoverListApi({
          size: 30,
          recommended: true,
        });
        setCharacters(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return { characters, loading };
};

function Home() {
  const { t } = useTranslation();
  const isMobile = useMobile();
  // 动态计算每行卡片数量
  const gridRef = useRef<HTMLDivElement>(null);
  const [columnsPerRow, setColumnsPerRow] = useState(0);
  useEffect(() => {
    if (!gridRef.current) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const calculateColumns = (width: number) => {
      const gap = isMobile ? 8 : 16;
      const minCardWidth = isMobile ? 300 : 220;

      if (isMobile) {
        setColumnsPerRow(2);
      } else {
        const columns = Math.floor((width + gap) / (minCardWidth + gap));
        setColumnsPerRow(Math.min(5, Math.max(1, columns)));
      }
    };

    // 防抖处理
    const debouncedCalculate = (width: number) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        calculateColumns(width);
      }, 150); // 150ms 防抖延迟
    };

    // 使用 ResizeObserver 监听容器大小变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        debouncedCalculate(width);
      }
    });

    resizeObserver.observe(gridRef.current);

    // 初始计算
    calculateColumns(gridRef.current.offsetWidth);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [isMobile]);

  const { tags, open: openTagsSelect } = useHomeServices();
  const { config: homeDisplayConfig, carouselCharacters, carouselLoading } = useHomeDisplay();
  const { characters: recommendedCharacters, loading: recommendedLoading } =
    useRecommended();
  const [searchInput, setSearchInput] = useState("");
  const [params, setParams] = useState<
    Omit<API.Character.FetchListParams, "page"> & { refreshTrigger?: number }
  >({
    size: 32,
    q: "",
    tags,
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setParams((prev) => ({
          ...prev,
          refreshTrigger: (prev.refreshTrigger ?? 0) + 1,
        }));
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 防抖：用户停止输入 300ms 后才更新搜索参数
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams((prev) => ({
        ...prev,
        q: searchInput,
      }));
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      tags,
    }));
  }, [tags]);

  const { open } = useCharacterServices();
  const { nsfwEnabled, enableNSFW, disableNSFW } = useNSFW();
  const { token } = useAuthStore(useShallow((state) => ({ token: state.token })));
  useMemberInfo(!!token);
  const { setOpenAuth } = useGlobalServer();
  
  const {
    loading,
    onLoadMore,
    hasMore,
    count,
    data: characters,
    setData,
  } = useInfiniteScroll<API.Character.CHARACTER>(
    fetchCharacterDiscoverListApi as any,
    params
  );
  useEffect(() => {
    const handleFollow = (data: { id: string; followed: boolean }) => {
      setData((prev) =>
        prev.map((item) => {
          if (item.id === data.id) {
            //计算总数
            let count = item?.social?.followed_count ?? 0;
            if (item?.followed && !data.followed) {
              count -= 1;
            } else if (!item?.followed && data.followed) {
              count += 1;
            }
            return {
              ...item,
              followed: data.followed,
              social: { ...item.social, followed_count: count },
            };
          } else {
            return item;
          }
        })
      );
    };
    emitter.on("follow", handleFollow);
    return () => {
      emitter.off("follow", handleFollow);
    };
  }, []);
  const { open: openSearch, visible, close } = useModal();

  const filteredCharacters = useMemo(() => {
    return characters;
  }, [characters]);

  const reorderedForDisplay = useMemo(() => {
    const order = homeDisplayConfig?.top_character_ids ?? [];
    if (order.length === 0) return filteredCharacters;
    const byId = new Map(filteredCharacters.map((c) => [c.id, c]));
    const top = order.map((id) => byId.get(id)).filter(Boolean) as API.Character.CHARACTER[];
    const rest = filteredCharacters.filter((c) => !order.includes(c.id));
    return [...top, ...rest];
  }, [filteredCharacters, homeDisplayConfig?.top_character_ids]);

  //这里对列表显示做一个前端优化
  const visibleCharacters = useMemo(() => {
    if (reorderedForDisplay.length === count) {
      return reorderedForDisplay;
    } else {
      const invisibleCount = reorderedForDisplay?.length % columnsPerRow;
      return reorderedForDisplay.slice(0, reorderedForDisplay.length - invisibleCount);
    }
  }, [reorderedForDisplay, columnsPerRow, count]);
  
  // 处理 NSFW 开关变化
  const handleNSFWToggle = (checked: boolean) => {
    // 如果未登录，打开注册窗口并记录标记
    if (!token) {
      if (checked) {
        // 记录用户想要启用 NSFW
        localStorage.setItem('nsfw_pending_enable', 'true');
        setOpenAuth(true, 'signup');
      }
      return;
    }
    
    // 已登录用户正常处理
    if (checked) {
      // 开启时直接启用 NSFW（不再显示确认对话框）
      enableNSFW();
    } else {
      // 关闭时直接禁用 NSFW
      disableNSFW();
    }
  };
  
  // 处理 Card 上的 Show 按钮点击
  const handleShowNSFW = () => {
    // 如果未登录，打开注册窗口并记录标记
    if (!token) {
      localStorage.setItem('nsfw_pending_enable', 'true');
      setOpenAuth(true, 'signup');
      return;
    }
    // 已登录用户直接启用 NSFW（不再显示确认对话框）
    enableNSFW();
  };
  return (
    <div
      id="home-scroll-container"
      className="flex-1 flex flex-col min-h-0 overflow-auto w-full"
    >
      <BaseContainer className="flex flex-col flex-1 max-sm:pb-24 max-sm:min-h-full">
      <CarouselEx
        items={homeDisplayConfig?.carousel?.slots?.length ? carouselCharacters : recommendedCharacters}
        loading={homeDisplayConfig?.carousel?.slots?.length ? carouselLoading : recommendedLoading}
        onItemClick={(item) => {
          open(item.id);
        }}
      >
        <div className="w-full px-14 pt-[97px] max-sm:px-3 max-sm:pt-[60px]">
          <Banner
            images={homeDisplayConfig?.banner?.images?.length ? homeDisplayConfig.banner.images : [{ url: BANNER_URL }]}
          />
        </div>

        {/* {isMobile && (
          <div
            className="text-[18px] font-bold font-urbanist mt-8"
            style={{ color: "#F5F5F5", textAlign: "center" }}
          >
            {t("aboutUs.hero.title1")} {t("aboutUs.hero.title2")}
          </div>
        )} */}
      </CarouselEx>
      {/* <CoverFlow items={characters?.slice(0, 30)} className="flex-shrink-0 my-6"></CoverFlow> */}
      <div className="flex flex-col px-14 max-sm:px-3">
        <div className="flex justify-between items-center mt-[21px] max-sm:mt-[14px] gap-2 min-w-0">
          <div className="flex gap-2 min-w-0 flex-1 max-sm:flex-shrink">
            <Select
              value={params.sort}
              onValueChange={(value) =>
                setParams((prev) => ({
                  ...prev,
                  sort: value as API.Character.FetchListParams["sort"],
                }))
              }
            >
              <SelectTrigger className="w-[140px] max-sm:w-[112px] min-w-0">
                <SelectValue placeholder={t("common.sort")} />
              </SelectTrigger>
              <SelectContent>
                {getSortOptions(t).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-[38px] rounded-full w-[140px] max-sm:w-[112px] min-w-0 overflow-hidden"
              style={{ background: "#0E0F17" }}
              onClick={openTagsSelect}
            >
              <div className="flex justify-between items-center w-full">
                <span>{t("common.tags")}</span>
                <ArrowRightFillIcon className="w-[6px] h-3 text-[#F5F5F5]" />
              </div>
            </Button>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="mr-1 flex items-center gap-2 md:mr-2" id="nsfw-toggle">
              <button
                type="button"
                role="switch"
                aria-checked={nsfwEnabled}
                data-state={nsfwEnabled ? "checked" : "unchecked"}
                value="on"
                className={`group peer relative inline-flex h-6 w-[70px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
                  nsfwEnabled 
                    ? "" 
                    : "bg-zinc-600 dark:bg-zinc-400/50"
                }`}
                style={nsfwEnabled ? {
                  background: "linear-gradient(90deg, #D743A7 0%, #8B5CF6 100%)"
                } : {}}
                onClick={() => handleNSFWToggle(!nsfwEnabled)}
                title={nsfwEnabled ? "Set NSFW off" : "Set NSFW on"}
              >
                <div 
                  className={`absolute select-none text-xs font-semibold transition-transform ${
                    nsfwEnabled 
                      ? "left-1.5 text-white" 
                      : "right-1.5 text-zinc-300"
                  }`}
                >
                  NSFW
                </div>
                <span
                  data-state={nsfwEnabled ? "checked" : "unchecked"}
                  className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ${
                    nsfwEnabled 
                      ? "translate-x-[3rem] group-active:translate-x-[calc(3rem-8px)]" 
                      : "translate-x-0.5"
                  } group-active:w-6`}
                />
              </button>
            </div>
            
            {!isMobile ? (
              <InputGroup className="w-[184px] rounded-full">
                <InputGroupInput
                  placeholder={t("common.search")}
                  className="w-[124px]"
                  style={{ background: "none" }}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <InputGroupAddon className="bg-transparent">
                  <SearchIcon className="w-5 h-5 text-white" />
                </InputGroupAddon>
              </InputGroup>
            ) : (
              <div
                className="flex size-[38px] shrink-0 items-center justify-center rounded-full max-sm:ml-0 -ml-3"
                onClick={openSearch}
              >
                <SearchIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
        <div
          ref={gridRef}
          className="grid mt-[14px] gap-4 max-sm:gap-2 w-full"
          style={{
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : `repeat(${columnsPerRow}, 1fr)`,
            justifyContent: "center",
          }}
        >
          {visibleCharacters?.map((item, index) => (
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
        <div className="flex w-full justify-center pt-[70px] pb-[95px] max-sm:pt-[17px] max-sm:pb-[10px]">
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
      <Search visible={visible} close={close} />
      <Footer />
      </BaseContainer>
    </div>
  );
}

const HomeWithProviders = install(Home, [CharacterServicesProvider, HomeServicesProvider]);

export default HomeWithProviders;
