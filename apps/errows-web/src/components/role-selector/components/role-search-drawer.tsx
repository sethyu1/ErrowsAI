import React from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent } from "@errows/design/components/drawer";
import { BackIcon, SearchIcon } from "@errows/icons";
import { InputGroup, InputGroupAddon, InputGroupInput, Button } from "@errows/design";
import { useMobile } from "@/hooks/use-mobile-detector";
import { useInfiniteScroll } from "@/components/infinite-scroll";
import { fetchCharacterDiscoverListApi } from "@/apis/character";
import { RoleImageCard, Loading } from '@/components';
import { useViewportHeight } from "@/hooks/use-viewport-height";
import dayjs from 'dayjs';

interface RoleSearchDrawerProps {
    visible: boolean;
    close: () => void;
    sort: API.Character.FetchListParams['sort'];
    tags: API.Character.FetchListParams['tags'];
    selectedUser: string;
    onSelectUser: (userId: string) => void;
    onConfirm: () => void;
}

export const RoleSearchDrawer: React.FC<RoleSearchDrawerProps> = ({
    visible,
    close,
    sort,
    tags,
    selectedUser,
    onSelectUser,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const viewportHeight = useViewportHeight();
    // 独立的搜索状态，不影响外部
    const [searchQuery, setSearchQuery] = React.useState<string>('');

    const [params, setParams] = React.useState<
        Omit<API.Character.FetchListParams, "page">
    >({
        size: 100,
        q: '',
        sort,
        tags,
    });

    // 当抽屉打开时，重置搜索状态
    React.useEffect(() => {
        if (visible) {
            setSearchQuery('');
            setParams({
                size: 100,
                q: '',
                sort,
                tags,
            });
        }
    }, [visible, sort, tags]);

    // 当搜索、排序或标签变化时，更新参数
    React.useEffect(() => {
        setParams((prev) => ({
            ...prev,
            q: searchQuery,
            sort,
            tags,
        }));
    }, [searchQuery, sort, tags]);

    const isMobile = useMobile();
    const fetchFunction = React.useCallback(
        (query: { page: number; size: number;[key: string]: unknown }) => {
            return fetchCharacterDiscoverListApi({
                ...params,
                ...query,
            });
        },
        [params]
    );

    const {
        data: characters,
        loading,
    } = useInfiniteScroll<API.Character.CHARACTER>(
        fetchFunction,
        params
    );

    const contentRef = React.useRef<HTMLDivElement>(null);

    // 键盘弹出时保持布局稳定
    React.useEffect(() => {
        if (!visible) return;

        const handleResize = () => {
            if (contentRef.current) {
                const viewportHeight = window.visualViewport?.height || window.innerHeight;
                contentRef.current.style.height = `${viewportHeight}px`;
            }
        };

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
            direction="right"
            handleOnly
        >
            <DrawerContent
                ref={contentRef}
                className="data-[vaul-drawer-direction=right]:w-screen z-1000 bg-[#1b1227] flex flex-col"
                style={{
                    height: `${viewportHeight}px`,
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0
                }}
            >
                <div>
                    <div className="flex items-center h-[72px] gap-4 border-b border-[#2C2C38] pr-7 pl-5 shrink-0">
                        <BackIcon className="w-5 h-5" onClick={close} />
                        <InputGroup className="rounded-full">
                            <InputGroupAddon>
                                <SearchIcon />
                            </InputGroupAddon>
                            <InputGroupInput
                                placeholder={t('role.selector.searchCharacter')}
                                className="h-[38px]"
                                style={{ background: "none" }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                    <div className="w-full flex-1 overflow-auto flex flex-col">
                        {loading && !characters.length && (
                            <div
                                className="flex-1 flex items-center justify-center"
                                style={{
                                    minHeight: '400px',
                                }}
                            >
                                <Loading
                                    style={{
                                        fontSize: '48px',
                                        color: 'white',
                                    }}
                                />
                            </div>
                        )}
                        {!loading && characters.length === 0 && searchQuery && (
                            <div className="flex-1 flex items-center justify-center"
                                style={{
                                    minHeight: '400px',
                                }}
                            >
                                <p className="text-white font-urbanist font-medium text-base">{t('multimedia.noData')}</p>
                            </div>
                        )}
                        {!loading && characters.length > 0 && (
                            <div className={`flex-1 flex flex-wrap  gap-2 overflow-y-auto scrollbar-hide ${characters.length !== 1 ? 'justify-center' : ''}`}
                                style={{
                                    padding: '16px',
                                    minHeight: '400px',
                                }}
                            >
                                {characters?.map((character) => (
                                    <div className='flex flex-col items-center gap-2' key={character.id}>
                                        <RoleImageCard
                                            imageUrl={character.avatar_url}
                                            name={character.nickname}
                                            selected={selectedUser === character.id}
                                            onClick={() => onSelectUser(character.id)}
                                            size="small"
                                            locked={false}
                                            isMobile={isMobile}
                                            noShadow
                                        />
                                        {/* <div className='font-urbanist font-regular text-xs text-[#E7E9EB]'>{
                                        dayjs(character.created_at).format('YYYYMMDD-HHmmss')}</div> */}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-center shrink-0 mt-10 mb-10">
                            <Button
                                appearance="gradientFill"
                                className="text-white font-urbanist font-medium text-base"
                                onClick={() => {
                                    onConfirm();
                                    close();
                                }}
                                disabled={!selectedUser}
                                size="sm"
                                shape="round"
                                style={{
                                    padding: "8px 26px",
                                    width: 240,
                                    margin: '0 auto',
                                }}
                            >
                                {t('common.confirm')}
                            </Button>
                        </div>
                    </div>
                    <div className="safe-area-bottom"></div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

