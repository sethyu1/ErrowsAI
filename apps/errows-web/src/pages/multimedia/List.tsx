import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@errows/design/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  InputGroup,
  InputGroupInput,
} from "@errows/design";
import { SearchIcon } from "@errows/icons";
import { InputGroupAddon } from "@errows/design/components/input-group";
import { NUMBER_SORTS, TAG_SORTS } from "./constants";
import { useMobile } from "@/hooks/use-mobile-detector";
import { useMobileStyle } from "@/hooks/use-mobile-style";
import { useMobileSearch } from "@/hooks/use-mobile-search";
import { MultimediaWrapper } from "./wrapper";
import {
  MultimediaTab,
  CardList,
  MediaMobileSearch,
} from "./components";
import { NormalTitle, Loading, ListEmpty } from "@/components";
import { fetchMyCharacterImagesApi, fetchMyCharacterVideosApi } from "@/apis/character";
import { useQuery } from "@tanstack/react-query";
import type { RoleMedia } from './type';
import { Icon } from "@iconify/react";
import { ParseCustomParams } from "./util";
import { useModal } from "@/hooks/use-modal";
import { CreateEntryCard } from "./components/create-entry";

function Multimedia() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('tab') || searchParams.get('type'); // 兼容旧参数
  const [sort, setSort] = useState<string>("number");
  const [tagSort, setTagSort] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(type || "image");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { open: openSearch, visible, close } = useModal();
  const {
    searchInputRef,
    searchContainerRef,
    handleSearchInputFocus,
  } = useMobileSearch(isMobile);
  // 移动端卡片宽度：保证一行2个 (屏幕宽度 - 左右padding 24px - gap 8px) / 2，最大179px
  const mobileCardWidth = Math.min(179, Math.floor((window.innerWidth - 32) / 2));
  const mobileStyle = useMobileStyle({
    cardWidth: mobileCardWidth,
    isMobile,
  });

  useEffect(() => {
    setActiveTab(type || "image");
  }, [type]);

  // 查询用户图片媒体库
  const {
    data: imageMediaList,
    status: imageStatus,
    error: imageError,
  } = useQuery({
    queryKey: ["myCharacterImages", searchQuery, tagSort, sort],
    queryFn: () => fetchMyCharacterImagesApi({ q: searchQuery, ...ParseCustomParams({ sort: sort, tags: tagSort }) }),
    enabled: activeTab === "image",
    staleTime: 0, // 不缓存，总是重新请求
    refetchOnMount: 'always', // 每次挂载时都重新请求
  });

  // 查询用户视频媒体库
  const {
    data: videoMediaList,
    status: videoStatus,
    error: videoError,
  } = useQuery({
    queryKey: ["myCharacterVideos", searchQuery, sort, tagSort],
    queryFn: () => fetchMyCharacterVideosApi({ q: searchQuery,...ParseCustomParams({ sort: sort, tags: tagSort }) }),
    enabled: activeTab === "video",
    staleTime: 0, // 不缓存，总是重新请求
    refetchOnMount: 'always', // 每次挂载时都重新请求
  });

  // 图片列表数据
  const imageList: RoleMedia[] = useMemo(() => {
    if (activeTab !== "image" || !imageMediaList) return [];
    return imageMediaList.map((item) => ({
      id: item.character?.id || item.cid,
      nickname: item.character?.nickname,
      avatar: item.cover,
      count: item.count,
    }));
  }, [imageMediaList, activeTab]);

  // 视频列表数据
  const videoList: RoleMedia[] = useMemo(() => {
    if (activeTab !== "video" || !videoMediaList) return [];
    return videoMediaList.map((item) => ({
      id: item.character?.id || item.cid,
      nickname: item.character?.nickname,
      avatar: item.cover,
      count: item.count,
      url: item.url,
    }));
  }, [videoMediaList, activeTab]);

  // 当前状态和错误
  const currentStatus = activeTab === "image" ? imageStatus : videoStatus;
  const currentError = activeTab === "image" ? imageError : videoError;
  const currentList = activeTab === "image" ? imageList : videoList;

  const FilterDom = useMemo(() => {
    return (
      <div
        className={cn(
          "flex items-center justify-between",
          isMobile ? "mt-4" : "pt-3.5"
        )}
        style={{
          marginBottom: isMobile ? 16 : 0,
        }}
      >
        {/* 左侧：排序下拉菜单 */}
        <div className="flex items-center gap-4">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className={cn("w-[140px]", isMobile ? "w-28" : "")}>
              <SelectValue placeholder={t('multimedia.sortByNumber')} />
            </SelectTrigger>
            <SelectContent>
              {NUMBER_SORTS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`multimedia.${option.value === 'number' ? 'sortByNumber' : option.value === 'latest' ? 'sortByLatest' : 'sortByAZ'}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isMobile && <Select value={tagSort} onValueChange={setTagSort}>
            <SelectTrigger 
              className={cn("w-[140px]", isMobile ? "w-28" : "")}
              showClearIcon={tagSort !== ""}
              onClear={() => {
                setTagSort("")
              }}
            >
              <SelectValue placeholder={t('multimedia.allTags')} />
            </SelectTrigger>
            <SelectContent>
              {TAG_SORTS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {[ 'futa', 'deleted'].includes(option.value) ? t(`multimedia.${option.value}`) : t(`common.${option.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          }
        </div>
        {/* 右侧：搜索框和创建按钮 */}
        <div className="flex items-center gap-4" ref={searchContainerRef}>
          {!isMobile &&
            <InputGroup className="rounded-2xl">
              <InputGroupInput
                ref={searchInputRef}
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchInputFocus}
              />
              <InputGroupAddon className="px-0">
                <div className="mr-2">
                  <SearchIcon className="w-4 h-4 text-white pointer-events-none" />
                </div>
              </InputGroupAddon>
            </InputGroup>
          }
          {isMobile && <div
            className="flex size-[38px] items-center justify-center rounded-full border border-[#FFFFFF4D] cursor-pointer active:opacity-70 transition-opacity"
            onClick={openSearch}
            onTouchEnd={openSearch}
          >
            <SearchIcon className="w-4 h-4 text-white" />
          </div>}
        </div>
      </div>
    );
  }, [t, setSearchQuery, isMobile, sort, tagSort, searchQuery, handleSearchInputFocus, searchContainerRef, searchInputRef, openSearch]);

  return (
    <div>
      {!isMobile && FilterDom}
      {!isMobile && (
        <NormalTitle>
          {activeTab === "image" ? t('multimedia.imageTab') : t('multimedia.videoTab')}
        </NormalTitle>
      )}
      <MultimediaTab
        isMobile={isMobile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {isMobile && FilterDom}

      {/* 内容区域 */}
      {currentStatus === 'pending' && (
        <div className="h-full flex flex-col items-center justify-center"
          style={{
            padding: isMobile ? '60px  0' : '100px  0',
            gap: isMobile ? 16 : 20,
            fontSize: 40,
          }}>
          <Loading />
          <p className="text-gray-400 font-urbanist text-lg">{t('common.loading')}</p>
        </div>
      )}

      {currentStatus === 'error' && (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Icon icon="mdi:alert-circle" className="w-12 h-12 text-red-500" />
            <p className="text-red-400 font-urbanist text-sm">
              {t('multimedia.noData')}
            </p>
            <p className="text-gray-500 font-urbanist text-xs">
              {currentError instanceof Error ? currentError.message : 'Unknown error'}
            </p>
          </div>
        </div>
      )}

      {currentStatus === 'success' && currentList.length === 0 && (
        <div className="h-full flex items-center">
          <div className="flex flex-col items-center gap-3">
            {/* <ListEmpty /> */}
            <CreateEntryCard type={activeTab as "image" | "video"} />
          </div>
        </div>
      )}

      <div style={isMobile ? {
        ...mobileStyle,
        overflowY: 'auto',
      } : {}} className="scrollbar-hide">
        {currentStatus === 'success' && currentList.length > 0 && (
          <CardList
            list={currentList}
            type={activeTab as "image" | "video"}
            batchMode={false}
            selectedList={[]}
            statisticsMode
            createEntryCard
            handleItemClick={(id) => {
              navigate(`/multimedia/info/${id}?tab=${activeTab}`);
            }}
          />
        )}
      </div>
      <MediaMobileSearch
        activeTab={activeTab as "image" | "video"}
        visible={visible}
        close={close}
      />
    </div>
  );
}

export default function MultimediaPage() {
  return (
    <MultimediaWrapper>
      <Multimedia />
    </MultimediaWrapper>
  );
}
