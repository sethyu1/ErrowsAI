import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Button,
    InputGroup,
    InputGroupInput,
    InputGroupAddon,
} from "@errows/design";
import { RoleImageCard, Loading } from '@/components';
import { SearchIcon, ArrowRightFillIcon } from "@errows/icons";
import dayjs from 'dayjs';
import { useMobile } from "@/hooks/use-mobile-detector";
import { cn } from "@errows/design/lib/utils";
import { SORT_OPTIONS_CONFIG } from "../utils";
import type { Tags } from "../types";

interface RoleListContentProps {
    selectedCharacter?: API.Character.CHARACTER;
    characters: API.Character.CHARACTER[];
    selectedUser: string;
    searchQuery: string;
    sort: API.Character.FetchListParams['sort'];
    tags: Tags;
    isLoading: boolean;
    onSelectUser: (userId: string) => void;
    onSearchChange: (value: string) => void;
    onSortChange: (value: API.Character.FetchListParams['sort']) => void;
    onTagFilterOpen: () => void;
    onSearchOpen?: () => void;
    onConfirm: () => void;
}

export const RoleListContent: React.FC<RoleListContentProps> = ({
    characters,
    selectedUser,
    searchQuery,
    sort,
    isLoading,
    onSelectUser,
    onSearchChange,
    onSortChange,
    onTagFilterOpen,
    onSearchOpen,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const isMobile = useMobile();
    
    const SORT_OPTIONS = useMemo(
        () => SORT_OPTIONS_CONFIG.map(option => ({
            ...option,
            label: t(option.labelKey)
        })),
        [t]
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col gap-4 shrink-0" style={{ padding: '0 16px' }}>
                <div className={`flex justify-between items-center ${isMobile ? 'mt-[21px] mb-2 max-sm:mt-[14px]' : ''}`}>
                    <div className="flex gap-2 mb-2">
                        <Select 
                            value={sort} 
                            onValueChange={(value) => onSortChange(value as API.Character.FetchListParams['sort'])}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder={t('role.selector.filter')} />
                            </SelectTrigger>
                            <SelectContent 
                                className="z-10002"
                                side="bottom"
                                align="start"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            className="h-[38px] rounded-full w-[140px]"
                            style={{ background: "#0E0F17" }}
                            onClick={onTagFilterOpen}
                        >
                            <div className="flex justify-between items-center w-full">
                                <span>{t('role.selector.filter')}</span>
                                <ArrowRightFillIcon className="w-[6px] h-3 text-[#F5F5F5]" />
                            </div>
                        </Button>
                    </div>

                    {!isMobile ? (
                        <InputGroup className="w-[184px] rounded-full">
                            <InputGroupInput
                                placeholder={t('role.selector.searchCharacter')}
                                className="w-[124px]"
                                style={{ background: "none" }}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                            <InputGroupAddon className="bg-transparent">
                                <SearchIcon className="w-5 h-5 text-white" />
                            </InputGroupAddon>
                        </InputGroup>
                    ) : (
                        <div
                            className="flex size-[38px] items-center justify-center rounded-full border border-[#FFFFFF4D]"
                            onClick={onSearchOpen}
                        >
                            <SearchIcon className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>
            </div>
            
            {/* 内容区域 - 动态高度，支持滚动 */}
            <div className={cn(
                "flex-1 min-h-0 flex flex-col",
            )} style={{ padding: '0 16px' }}>
                {isLoading && !characters.length && (
                    <div className="flex-1 flex items-center justify-center">
                        <Loading
                            style={{
                                fontSize: '48px',
                                color: 'white',
                            }}
                        />
                    </div>
                )}
                {!isLoading && characters.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-white font-urbanist font-medium text-base">{t('multimedia.noData')}</p>
                    </div>
                )}
                {!isLoading && characters.length > 0 && (
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                        <div className={`flex flex-wrap  gap-2 ${characters.length !==1 ? 'justify-center' : ''}`}>
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
                    </div>
                )}
            </div>
            
            <div className="flex justify-center shrink-0 mt-4 mb-4" style={{ padding:'0 16px' }}>
                <Button
                    appearance="gradientFill"
                    className="text-white font-urbanist font-medium text-base"
                    onClick={onConfirm}
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
            <div className="safe-area-bottom"></div>
        </div>
    );
};

