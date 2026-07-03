import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMobile } from "@/hooks/use-mobile-detector";
import { Icon } from '@iconify/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@errows/design";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@errows/design/components/drawer";
import { cn } from "@errows/design/lib/utils";
import { useModal } from "@/hooks/use-modal";
import { Button } from "@errows/design";
import { CloseIcon, BackIcon } from "@errows/icons";
import type { FieldOption } from '../../../types'

interface TagsSelectionProps {
    value?: string[];
    onChange?: (tags: string[]) => void,
    max_select?: number,
    defaultOptions?: FieldOption[]
}

interface GroupedOption {
    group: string;
    items: FieldOption[];
}

export const TagsSelection: React.FC<TagsSelectionProps> = (
    { value, onChange, max_select = 9, defaultOptions = [] }: TagsSelectionProps
) => {
    const { t } = useTranslation();
    const tagsSelectionModal = useModal<boolean>();
    const isMobile = useMobile();

    // 按 group 分组
    const groupedOptions = React.useMemo<GroupedOption[]>(() => {
        if (!Array.isArray(defaultOptions) || defaultOptions.length === 0) {
            return [];
        }

        const groupMap = new Map<string, FieldOption[]>();
        
        defaultOptions.forEach((option) => {
            const group = option.group || 'Other';
            if (!groupMap.has(group)) {
                groupMap.set(group, []);
            }
            groupMap.get(group)!.push(option);
        });

        return Array.from(groupMap.entries()).map(([group, items]) => ({
            group,
            items,
        }));
    }, [defaultOptions]);

    const [selectedTags, setSelectedTags] = React.useState<string[]>(value || []);

    const handleSelectTag = (tag: string) => {
        setSelectedTags((prev) => {
            if (prev.includes(tag)) {
                return prev.filter((t) => t !== tag);
            } else {
                return [...prev, tag].slice(0, max_select);
            }
        });
    };
    const handleClearTags = () => {
        setSelectedTags([]);
    };

    const handleDone = () => {
        tagsSelectionModal.close();
        onChange?.(selectedTags);
    };
    useEffect(() => {
        if(tagsSelectionModal?.visible) setSelectedTags(value ?? [])
    }, [value, tagsSelectionModal?.visible])

    return (
        <>
            <button
                type="button"
                onClick={() => tagsSelectionModal.open()}
                className={cn(
                    'w-full h-9 rounded-md border bg-transparent px-3 py-1 text-left text-sm',
                    'border-[#2C2C38] text-white',
                    'focus:outline-none focus:ring-2 focus:ring-white/50',
                    'flex items-center justify-between'
                )}
            >
                <span className={selectedTags.length > 0 ? 'text-white' : 'text-gray-500'}>
                    {value && value.length > 0 ? t('tagDropdown.tagsSelected', { count: value.length }) : t('tagDropdown.selectUpToTags', { max_select: max_select })}
                </span>
                <Icon
                    icon="mdi:chevron-down"
                    className={cn('h-4 w-4 text-white transition-transform', tagsSelectionModal.visible && 'rotate-180')}
                />
            </button>
            {!isMobile && (
                <Dialog open={tagsSelectionModal?.visible} onOpenChange={(open) => {
                    if (!open) tagsSelectionModal.close();
                }}>
                    <DialogContent className="w-[600px] !max-w-none max-h-[80vh] overflow-y-auto overflow-x-hidden bg-[#0A0A0F] border-[#2C2C38]">
                        <DialogHeader>
                            <DialogTitle className="text-white">{t('common.tags')}</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 h-[400px] overflow-y-auto scrollbar-hide relative">
                            {groupedOptions.map((group) => (
                                <div key={group.group} className="flex flex-col gap-4">
                                    <div className="text-[#A4ACB9] text-[14px] font-medium font-roboto leading-[16px]">
                                        {t(`role.tagsSelection.${group.group}`)}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {group.items.map((option) => {
                                            const isSelected = selectedTags.includes(option.value);
                                            return (
                                                <div
                                                    key={option.value}
                                                    className={`cursor-pointer h-6 px-3 text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border ${
                                                        isSelected ? "border-white" : "border-[#FFFFFF1A]"
                                                    }`}
                                                    onClick={() => handleSelectTag(option.value)}
                                                >
                                                  {t(`characterOptions.labels.${option?.value}`)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            <div
                                className="sticky bottom-[-4px] min-h-7 left-0 right-0 w-full pointer-events-none h-7"
                                style={{
                                    background:
                                        "linear-gradient(180deg, rgba(27, 18, 39, 0) 0%, #1B1227 88.46%)",
                                }}
                            />
                        </div>

                        <div className="flex flex-wrap justify-start gap-2 h-[144px] overflow-y-auto p-5 bg-[#090A0A] rounded-[8px] border border-[#FFFFFF1A] backdrop-blur-sm">
                            {selectedTags.map((tagValue) => {
                                const option = defaultOptions.find((opt) => opt.value === tagValue);
                                return (
                                    <div
                                        key={tagValue}
                                        className={`flex items-center gap-2 cursor-pointer h-6 px-3 bg-[#1D1E27] text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border`}
                                        onClick={() => handleSelectTag(tagValue)}
                                    >
                                        {t(`characterOptions.labels.${option?.value}`)}
                                        <CloseIcon className="w-2 h-2" />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-center gap-[18px]">
                            <Button
                                shape="round"
                                className="w-[126px]"
                                style={{ background: "#22232A", color: "#ffffff" }}
                                onClick={handleClearTags}
                            >
                                {t('common.clear')}
                            </Button>
                            <Button
                                appearance="gradientFill"
                                className="w-[126px]"
                                shape="round"
                                onClick={handleDone}
                            >
                                {t('common.done')}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {isMobile && (
                <Drawer
                    direction="left"
                    open={tagsSelectionModal?.visible}
                    onOpenChange={tagsSelectionModal.close}
                    handleOnly
                >
                    <DrawerContent
                        className={cn(
                            "z-1000 data-[vaul-drawer-direction=left]:w-screen",
                            "bg-[#101018]"
                        )}
                    >
                        <DrawerHeader className="hidden">
                            <DrawerTitle />
                            <DrawerDescription />
                        </DrawerHeader>
                        <div className="flex flex-col w-full h-full relative">
                            <div className="flex items-center h-[72px] flex-shrink-0 px-6 gap-4 border-b border-[#2C2C38]">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-6 h-6"
                                    onClick={tagsSelectionModal.close}
                                >
                                    <BackIcon className="w-4 h-4" />
                                </Button>
                                <span className="text-[#FCFCFC] text-[18px] font-bold">
                                    {t('common.tags')}
                                </span>
                            </div>
                            <div className="flex flex-1 flex-col p-3 overflow-y-auto scrollbar-hide ">
                                <div className="flex flex-1 flex-col gap-4 pb-3 overflow-y-auto scrollbar-hide relative mb-5">
                                    {groupedOptions.map((group) => (
                                        <div key={group.group} className="flex flex-col gap-4">
                                            <div className="text-[#A4ACB9] text-[14px] font-medium font-roboto leading-[16px]">
                                                {t(`role.tagsSelection.${group.group}`)}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {group.items.map((option) => {
                                                    const isSelected = selectedTags.includes(option.value);
                                                    return (
                                                        <div
                                                            key={option.value}
                                                            className={`cursor-pointer h-6 px-3 text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border ${
                                                                isSelected ? "border-white" : "border-[#FFFFFF1A]"
                                                            }`}
                                                            onClick={() => handleSelectTag(option.value)}
                                                        >
                                                            {t(`characterOptions.labels.${option?.value}`)}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap justify-start gap-2 h-[144px] overflow-y-auto p-2 bg-[#090A0A] rounded-[8px] border border-[#FFFFFF1A] backdrop-blur-sm">
                                    {selectedTags.map((tagValue) => {
                                        const option = defaultOptions.find((opt) => opt.value === tagValue);
                                        return (
                                            <div
                                                key={tagValue}
                                                className={`flex items-center gap-2 cursor-pointer h-6 px-3 bg-[#1D1E27] text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border`}
                                                onClick={() => handleSelectTag(tagValue)}
                                            >
                                                {t(`characterOptions.labels.${option?.value}`)}
                                                <CloseIcon className="w-2 h-2" />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-center gap-[18px] h-20 pt-3" style={{
                                    background:
                                        "linear-gradient(180deg, rgba(9, 10, 10, 0) 0%, #090A0A 88.46%)",
                                }}>
                                    <Button
                                        shape="round"
                                        className="w-[126px]"
                                        style={{ background: "#22232A", color: "#ffffff" }}
                                        onClick={handleClearTags}
                                    >
                                        {t('common.clear')}
                                    </Button>
                                    <Button
                                        appearance="gradientFill"
                                        className="w-[126px]"
                                        shape="round"
                                        onClick={handleDone}
                                    >
                                        {t('common.done')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            )}
        </>
    );
};