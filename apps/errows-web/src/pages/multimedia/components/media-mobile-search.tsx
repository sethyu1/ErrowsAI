import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from '@tanstack/react-query';
import { fetchMyCharacterImagesApi, fetchMyCharacterVideosApi } from '@/apis';
import { Drawer, DrawerContent } from "@errows/design/components/drawer";
import { BackIcon, SearchIcon } from "@errows/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@errows/design";
import { ListEmpty } from "@/components";
import type { RoleMedia } from '../type';
import { CardList } from './card-list';
interface MediaMobileSearchProps {
    activeTab: 'image' | 'video';
    visible: boolean;
    close: () => void;
}

export const MediaMobileSearch = (props: MediaMobileSearchProps) => {
    const { t } = useTranslation();
    const { activeTab, visible, close } = props;
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);

    const cardItemWidth = Math.min(179, Math.floor((window.innerWidth - 32) / 2));

    // 查询用户图片媒体库
    const {
        data: imageMediaList,
        status: imageStatus,
    } = useQuery({
        queryKey: ["myCharacterImages", searchQuery],
        queryFn: () => fetchMyCharacterImagesApi({ q: searchQuery }),
        enabled: activeTab === "image",
        staleTime: 0, // 不缓存，总是重新请求
        refetchOnMount: 'always', // 每次挂载时都重新请求
    });

    // 查询用户视频媒体库
    const {
        data: videoMediaList,
        status: videoStatus,
    } = useQuery({
        queryKey: ["myCharacterVideos", searchQuery],
        queryFn: () => fetchMyCharacterVideosApi({ q: searchQuery }),
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
    const currentList = activeTab === "image" ? imageList : videoList;


    // 键盘弹出时保持布局稳定
    useEffect(() => {
        if (!visible) return;
        setSearchQuery('');
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
                className="data-[vaul-drawer-direction=right]:w-screen bg-[#1b1227] flex flex-col"
                style={{
                    height: '100vh',
                }}
            >
                <div className="flex items-center h-[72px] gap-4 border-b border-[#2C2C38] pr-7 pl-5 shrink-0">
                    <BackIcon className="w-5 h-5" onClick={close} />
                    <InputGroup className="rounded-full">
                        <InputGroupAddon>
                            <SearchIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                            placeholder={t('common.search')}
                            className="h-[38px]"
                            style={{ background: "none" }}
                            value={searchQuery}
                            onChange={(e) =>
                                setSearchQuery(e.target.value)
                            }
                        />
                    </InputGroup>
                </div>
                <div className="w-full flex justify-center flex-wrap px-2 gap-2 overflow-auto">
                    {currentStatus === 'success' && currentList.length === 0 && (
                        <div className="mt-40">
                            <ListEmpty />
                        </div>
                    )}
                    {currentStatus === 'success' && currentList.length > 0 && (
                        <CardList
                            list={currentList}
                            type={activeTab}
                            batchMode={false}
                            selectedList={[]}
                            statisticsMode={true}
                            handleItemClick={(id) => {
                                navigate(`/multimedia/info/${id}?tab=${activeTab}`);
                            }}
                            style={{
                                width: cardItemWidth * 2 + 8
                            }}
                        />
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
};
