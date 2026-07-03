import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from '@tanstack/react-query';
import { fetchMyCharactersApi } from '@/apis';
import { Drawer, DrawerContent } from "@errows/design/components/drawer";
import { BackIcon, SearchIcon } from "@errows/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@errows/design";
import { useTranslation } from 'react-i18next';
import { RoleCard } from './role-card';
import { CreateEntryCard } from './create-entry';
import type { GalleryTab } from '../type';
import { cn } from "@errows/design/lib/utils";

interface GalleryMobileSearchProps {
    activeTab: GalleryTab;
    visible: boolean;
    generatingState: Record<string, API.Character.ListItem['status']>;
    editEnable: boolean;
    close: () => void;
    handleCardClick: (character: API.Character.ListItem) => void;
    handleMenuAction: (key: string, character: API.Character.ListItem) => void;
}

export const GalleryMobileSearch = (props: GalleryMobileSearchProps) => {
    const { t } = useTranslation();
    const { activeTab, generatingState = {}, visible, editEnable, close, handleCardClick, handleMenuAction } = props;
    const [searchQuery, setSearchQuery] = useState("");
    const contentRef = useRef<HTMLDivElement>(null);

    const {
        data,
    } = useQuery<{ data: API.Character.ListItem[] }>({
        queryKey: ['characters', activeTab, searchQuery],
        queryFn: async () => {
            return await fetchMyCharactersApi(activeTab, {
                page: 0,
                size: 100,
                q: searchQuery,
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

    const onlyOne = (activeTab === 'owned' && characters.length === 0) || activeTab !== 'owned' && characters.length === 1;

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
                <div className={cn('w-full flex  px-2 flex-1 flex-wrap gap-2 overflow-auto', onlyOne ? '' : 'justify-center')}>
                    {activeTab === 'owned' && <CreateEntryCard />}
                    { characters.map((character: API.Character.ListItem) => (
                        <RoleCard
                            roleInfo={character}
                            key={character.id + character.status}
                            noDelete={activeTab === 'deleted'}
                            onClick={() => handleCardClick(character)}
                            onAction={(key) => handleMenuAction(key, character)}
                            editEnable={editEnable}
                        />
                    ))}
                </div>
            </DrawerContent>
        </Drawer>
    );
};
