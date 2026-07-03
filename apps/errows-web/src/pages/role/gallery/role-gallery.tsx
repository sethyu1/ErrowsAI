import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, alertDialog, toast } from '@errows/design';
import { Icon } from '@iconify/react';
import { SearchIcon } from '@errows/icons';
import { fetchMyCharactersApi, deleteMyCharacterApi, generateCharacterAvatarApi, fetchMemberStatsApi } from '@/apis';
import { useMobile } from '@/hooks/use-mobile-detector';
import { useMobileSearch } from '@/hooks/use-mobile-search';
import { Loading, ListEmpty } from '@/components';
import { RoleCard } from './components/role-card';
import { CreateEntryCard, GalleryMobileSearch } from './components';
import { InputGroup, InputGroupInput, InputGroupAddon } from '@errows/design/components/input-group';
import { Start } from '../components/create/start';
import { usePostServices } from '@/pages/post/services';
import { useCharacterServices } from '../services';
import { useQuery } from '@tanstack/react-query';
import { copyToClipboard } from '@/utils/copy';
import { useMobileStyle } from '@/hooks/use-mobile-style';
import { useGlobalStore } from '@/stores/global';
import { useShallow } from 'zustand/react/shallow';
import { useModal } from '@/hooks/use-modal';
import type { GalleryTab } from './type';

const EditEnableTabs: GalleryTab[] = ['owned'];

export interface RoleGalleryProps {
    /** 当前选中的标签页 */
    activeTab?: GalleryTab;
    /** 标签页切换回调 */
    onTabChange?: (tab: GalleryTab) => void;
}

/**
 * 标签页配置
 */
const TABS_CONFIG: Array<{ key: GalleryTab; labelKey: string, statKey: keyof API.Member.Stats }> = [
    { key: 'owned', labelKey: 'role.create.myCreated', statKey: 'characters_private' },
    { key: 'followed', labelKey: 'role.create.myFollowings', statKey: 'characters_followed' },
    { key: 'liked', labelKey: 'role.create.myLikes', statKey: 'characters_liked' },
    // { key: 'public', labelKey: 'role.create.myPublic', statKey: 'characters_public' },
    // { key: 'deleted', labelKey: 'role.create.myDeleted', statKey: 'characters_deleted' },
];

/**
 * 排序选项
 */
const SORT_OPTIONS_CONFIG = [
    { value: 'popular', labelKey: 'role.create.mostFollowed' },
    { value: 'newest', labelKey: 'role.create.newestRoles' },
    { value: 'most_liked', labelKey: 'role.create.mostLiked' },
    { value: 'alphabetical', labelKey: 'role.create.alphabetical' },
];

/**
 * 角色图库列表组件
 */
export function RoleGallery({ activeTab: initialTab = 'owned' }: RoleGalleryProps) {
    const { t } = useTranslation();
    const setFromHomePage = useGlobalStore(useShallow(state => state.setFromHomePage));
    const { open: openSearch, visible, close } = useModal();
    const navigate = useNavigate();
    const isMobile = useMobile();
    const [activeTab, setActiveTab] = useState<GalleryTab>(initialTab);
    
    // 动态生成 TABS 和 SORT_OPTIONS，以支持多语言
    const TABS = useMemo(() => 
        TABS_CONFIG.map(tab => ({ ...tab, label: t(tab.labelKey) })),
        [t]
    );
    const SORT_OPTIONS = useMemo(() =>
        SORT_OPTIONS_CONFIG.map(option => ({ ...option, label: t(option.labelKey) })),
        [t]
    );
    const [sortBy, setSortBy] = useState<API.Character.FetchListParams['sort']>('newest');
    const [searchQuery, setSearchQuery] = useState('');
    // 跟踪是否是第一次加载且是否有数据
    const [isInitializedNoData, setInitializedNoData] = useState(false);
    const { create } = usePostServices();
    const { open, chatSettings } = useCharacterServices();
    const isOwned = activeTab === 'owned';
    const {
        searchInputRef,
        searchContainerRef,
        handleSearchInputFocus,
    } = useMobileSearch(isMobile);
    const mobileStyle = useMobileStyle({
        cardWidth: 180,
        isMobile,
        columnCount: 2,
    });

    const [generatingState, setGeneratingState] = useState<
        { [key: string]: API.Character.ListItem['status'] }
    >({});

    // TAB 滚动渐隐效果
    const tabScrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);

    // 检查滚动位置
    const handleTabScroll = useCallback(() => {
        const container = tabScrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftFade(scrollLeft > 0);
        setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    // 获取统计信息
    const { data: statsData, status: statsStatus } = useQuery({
        queryKey: ['memberStats'],
        queryFn: async () => {
            return await fetchMemberStatsApi();
        },
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        retry: false,
    });

    const {
        data,
        status,
        error,
        refetch,
    } = useQuery<{ data: API.Character.ListItem[] }>({
        queryKey: ['characters', activeTab, searchQuery, sortBy],
        queryFn: async () => {
            return await fetchMyCharactersApi(activeTab, {
                page: 0,
                size: 100,
                q: searchQuery,
                sort: sortBy as API.Character.FetchListParams['sort'],
            });
        },
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        retry: false,
    });

    // 获取角色列表
    const characters = useMemo(
        () => (data?.data ?? []).map((item) => ({
            ...item,
            status: generatingState[item.id] ?? item.status,
        })),
        [data, generatingState]
    );

    // 正在生成或者rebuildFace 中的角色id集合
    const generatingCharacterIds = useMemo(() => {
        return characters.filter((character: API.Character.ListItem) => character.status === 'generating' || character.status === 'pending').map((character: API.Character.ListItem) => character.id);
    }, [characters]);

    const FilterDom = useMemo(() => {
        {/* 第一行：筛选、搜索和创建按钮 */ }
        return (
            <div className={
                cn("flex items-center justify-between", isMobile ? 'px-2' : '')
            }
                style={{
                    marginBottom: isMobile ? 16 : 32,
                }}
            >
                {/* 左侧：排序下拉菜单 */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as API.Character.FetchListParams['sort'])}>
                    <SelectTrigger className={`flex-0 ${isMobile ? 'w-28' : ''}`} style={{
                        minWidth: 148,
                    }
                    }>
                        <SelectValue placeholder={t('role.create.mostFollowed')} />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {/* 右侧：搜索框和创建按钮 */}
                <div className="flex items-center gap-4" ref={searchContainerRef}>
                    {!isMobile &&
                        <InputGroup className="rounded-2xl">
                            <InputGroupInput
                                ref={searchInputRef}
                                type="text"
                                style={{
                                    ...isMobile ? { width: 172 } : {},
                                }}
                                placeholder={t('common.search')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={handleSearchInputFocus}
                            />
                            <InputGroupAddon className="px-0">
                                <div className='mr-2'>
                                    <SearchIcon
                                        className="w-4 h-4 text-white pointer-events-none"
                                    />
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
    }, [isMobile, sortBy, searchQuery, SORT_OPTIONS, t]);


    const handleCardClick = useCallback((character: API.Character.ListItem) => {
        if (open) open(character.id)
    }, [open]);

    const handleDeleteCharacter = useCallback((character: API.Character.ListItem) => {
        alertDialog.confirm({
            title: t('role.gallery.deleteCharacter'),
            content: t('role.gallery.deleteCharacterConfirm'),
            confirmText: t('common.delete'),
            cancelText: t('common.cancel'),
            onConfirm: async () => {
                try {
                    await deleteMyCharacterApi(character.id);
                    toast.success(t('role.gallery.characterDeletedSuccessfully'), {
                        position: 'top-center',
                        closeButton: false
                    });
                    await refetch();
                } catch {
                    // 保持静默失败，不改变当前 UI 状态
                }
            },
        });
    }, [refetch, t]);

    const handleGenerateAvatar = useCallback((character: API.Character.ListItem) => {
        alertDialog.confirm({
            title: t('role.gallery.rebuildFaceTitle'),
            content: t('role.gallery.rebuildFaceConfirm'),
            confirmText: t('common.generate'),
            cancelText: t('common.cancel'),
            onConfirm: async () => {
                try {
                    toast.success(t('role.gallery.characterImageGenerationStarted'), {
                        position: 'top-center',
                        closeButton: false
                    });
                    setGeneratingState((prev) => ({
                        ...prev,
                        [character.id]: 'generating',
                    }));
                    await generateCharacterAvatarApi(character.id);
                    await refetch();
                } catch {
                    // 保持静默失败，不改变当前 UI 状态
                } finally {
                    setGeneratingState(
                        ({ [character.id]: _, ...prev }) => prev
                    );
                }
            },
        });
    }, [refetch, t]);

    const handleMenuAction = useCallback((action: string, character: API.Character.ListItem) => {
        switch (action) {
            case 'rebuildFace':
                handleGenerateAvatar(character);
                break;
            case 'post':
                create(character.id,{
                    sortBy
                });
                break;
            case 'chat':
                chatSettings.open({
                    cid: character.id,
                });
                break;
            case 'generateImage':
                setFromHomePage(true);
                navigate(`/generate/image/${character.id}`);
                break;
            case 'generateVideo':
                setFromHomePage(true);
                navigate(`/generate/video/${character.id}`);
                break;
            case 'delete':
                handleDeleteCharacter(character);
                break;
            case 'copyLink':
                copyToClipboard(`${window.location.origin}/post/${character.id}`, t);
                break;
            default:
                break;
        }
    }, [create, handleDeleteCharacter, handleGenerateAvatar, chatSettings, navigate]);

    // 监听滚动和窗口大小变化
    useEffect(() => {
        const container = tabScrollContainerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleTabScroll);
        window.addEventListener('resize', handleTabScroll);

        // 初始检查
        handleTabScroll();

        return () => {
            container.removeEventListener('scroll', handleTabScroll);
            window.removeEventListener('resize', handleTabScroll);
        };
    }, [handleTabScroll]);

    useEffect(() => {
        if (statsStatus === 'success' && Object.values(statsData).every(value => value === 0)) {
            setInitializedNoData(true);
        } else {
            setInitializedNoData(false);
        }
    }, [statsStatus, statsData]);

    // 当有角色正在生成时，定时请求列表
    useEffect(() => {
        if (generatingCharacterIds.length > 0) {
            // 设置定时器每3秒请求一次
            const intervalId = setInterval(() => {
            refetch();
            }, 4000);

            return () => clearInterval(intervalId);
        }
    }, [generatingCharacterIds, refetch]);


    return (
        <div className="overflow-x-hidden overflow-y-auto  flex flex-col bg-gradient-to-b"
        >
            {/* 顶部工具栏 */}
            {
                !isInitializedNoData && <div>
                    <div className="flex-shrink-0 pt-4 pb-4"
                    >
                        {/* 第一行：筛选、搜索和创建按钮 */}
                        {!isMobile && FilterDom}

                        {/* 标签页 */}
                        <div className={cn("relative overflow-x-auto scrollbar-hide",
                            !isMobile && 'justify-center'
                        )}
                            ref={tabScrollContainerRef}
                            style={{
                                ...(!isMobile ? {
                                    borderBottom: '1px solid #2C2C38',
                                } : {}),
                            }}
                        >
                            <div className={`flex flex-nowrap ${!isMobile ? 'justify-center' : 'gap-8'}`}
                                style={{
                                    borderBottom: '1px solid #2C2C38',
                                }}
                            >
                                {TABS.map((tab) => {
                                    const isActive = activeTab === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActiveTab(tab.key)}
                                            style={{
                                                width: isMobile ? 124 : 160,
                                            }}
                                            className={cn(
                                                'relative cursor-pointer text-sm font-medium font-urbanist whitespace-nowrap transition-all duration-200',
                                                'w-40',
                                                'pb-2 px-1',
                                                activeTab === tab.key
                                                    ? 'text-white font-[700]'
                                                    : 'text-[#A4ACB9]'
                                            )}
                                        >
                                            {tab.label}
                                            <span className="ml-2">
                                                {statsData?.[tab.statKey] ?? ''}
                                            </span>
                                            {/* 下划线动画 */}
                                            {isActive && (
                                                <div className="absolute left-0 right-0  bg-white h-1" style={{
                                                    transform: 'translateY(100%)'
                                                }} />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* 左侧渐隐效果 */}
                            {showLeftFade && (
                                <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none z-10"
                                    style={{
                                        background: 'linear-gradient(to right, rgba(13, 13, 18, 1), transparent)',
                                    }}
                                />
                            )}

                            {/* 右侧渐隐效果 */}
                            {showRightFade && (
                                <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10"
                                    style={{
                                        background: 'linear-gradient(to left, rgba(13, 13, 18, 1), transparent)',
                                    }}
                                />
                            )}
                        </div>
                    </div>
                    {isMobile && <div>{FilterDom}</div>}
                </div>
            }

            {/* 内容区域 */}
            <div className="flex-1">
                {status === 'pending' && (
                    <div className="h-full flex flex-col items-center justify-center"
                        style={{
                            padding: isMobile ? '60px  0' : '100px  0',
                            gap: isMobile ? 16 : 20,
                            fontSize: 40,
                        }}>
                        <Loading />
                        <p className="text-gray-400 font-urbanist text-lg">{t('role.gallery.loadingCharacters')}</p >
                    </div>
                )}

                {status === 'error' && (
                    <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Icon icon="mdi:alert-circle" className="w-12 h-12 text-red-500" />
                            <p className="text-red-400 font-urbanist text-sm">
                                {t('role.gallery.failedToLoadCharacters')}
                            </p >
                            <p className="text-gray-500 font-urbanist text-xs">
                                {error instanceof Error ? error.message : t('role.gallery.unknownError')}
                            </p >
                        </div>
                    </div>
                )}

                {status === 'success' && characters.length === 0 && !isInitializedNoData && !isOwned && (
                    <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3" style={{
                            padding: '60px  0',
                            fontSize: 80
                        }}>
                            <ListEmpty title={t('role.gallery.noCharactersFound')} />
                        </div>
                    </div>
                )}

                {status === 'success' && (isOwned || characters.length > 0) && !isInitializedNoData && (
                    <div
                        className={cn(
                            'flex flex-wrap',
                            'overflow-y-auto',
                            'gap-2',
                        )}
                        style={{
                            paddingBottom: isMobile ? 0 : 32,
                            ...isMobile ? mobileStyle : {},
                        }}
                    >   
                        { isOwned && <CreateEntryCard /> }
                        {characters.map((character: API.Character.ListItem) => (
                            <RoleCard
                                roleInfo={character}
                                key={character.id + character.status}
                                noDelete={activeTab === 'deleted'}
                                onClick={() => handleCardClick(character)}
                                onAction={(key) => handleMenuAction(key, character)}
                                editEnable={!EditEnableTabs.includes(activeTab)}
                            />
                        ))}
                    </div>
                )}
            </div>
            {isInitializedNoData && (
                <div className="h-full flex items-center justify-center">
                    <Start />
                </div>
            )}
            <GalleryMobileSearch
                activeTab={activeTab}
                generatingState={generatingState}
                visible={visible}
                editEnable={!EditEnableTabs.includes(activeTab)}
                close={close}
                handleCardClick={handleCardClick}
                handleMenuAction={handleMenuAction}
            />
        </div>
    );
}