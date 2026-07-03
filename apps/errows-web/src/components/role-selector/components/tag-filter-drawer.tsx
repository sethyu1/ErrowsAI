import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@errows/design";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@errows/design/components/drawer";
import { CloseIcon, BackIcon } from "@errows/icons";
import { useViewportHeight } from "@/hooks/use-viewport-height";
import type { GroupedData, GroupedItem } from "../types";

interface TagFilterDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tagOptions: GroupedData[];
    selectedTags: (GroupedItem & { key: string })[];
    onSelectTag: (key: string, item: GroupedItem) => void;
    onClearTags: () => void;
    onDone: () => void;
}

export const TagFilterDrawer: React.FC<TagFilterDrawerProps> = ({
    open,
    onOpenChange,
    tagOptions,
    selectedTags,
    onSelectTag,
    onClearTags,
    onDone,
}) => {
    const { t } = useTranslation();
    const containerHeight = useViewportHeight(310);
    
    return (
        <Drawer
            direction="left"
            handleOnly
            open={open}
            onOpenChange={onOpenChange}
        >
            <DrawerContent
                className="z-1001 data-[vaul-drawer-direction=left]:w-screen bg-[#101018]"
            >
                <DrawerHeader className="hidden">
                    <DrawerTitle />
                    <DrawerDescription />
                </DrawerHeader>
                <div className="w-full h-full relative">
                    <div className="flex items-center h-[72px] px-6 gap-4 border-b border-[#2C2C38]">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() => onOpenChange(false)}
                        >
                            <BackIcon className="w-4 h-4" />
                        </Button>
                        <span className="text-white text-[18px] font-bold text-[#FCFCFC]">
                            {t('role.selector.filter')}
                        </span>
                    </div>
                    <div className="flex flex-col p-3 ">
                        <div className="flex flex-col gap-4 pb-3 overflow-y-auto scrollbar-hide relative" style={{ height: `${containerHeight}px` }}>
                            {tagOptions.map((item) => (
                                <div key={item.key} className="flex flex-col gap-4">
                                    <div className="text-[#A4ACB9] text-[14px] font-medium font-roboto leading-[16px]">
                                        {t(`characterOptions.titles.${item.key}`)}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {item.items.map((c) => {
                                            const isSelected = selectedTags.some(
                                                (tag) =>
                                                    tag.key === item.key && tag.value === c.value
                                            );
                                            return (
                                                <div
                                                    key={c.value}
                                                    className={`cursor-pointer h-6 px-3 text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border ${isSelected
                                                            ? "border-white"
                                                            : "border-[#FFFFFF1A]"
                                                        }`}
                                                    onClick={() => onSelectTag(item.key, c)}
                                                >
                                                    {t(`characterOptions.labels.${c.label}`)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            <div
                                className="sticky bottom-[-14px] min-h-[75px] left-0 right-0 w-full h-[75px] pointer-events-none -mt-[75px]"
                                style={{
                                    background:
                                        "linear-gradient(180deg, rgba(9, 10, 10, 0) 0%, #090A0A 88.46%)",
                                }}
                            />
                        </div>
                        <div className="flex flex-wrap justify-start gap-2 h-[144px] overflow-y-auto p-3 bg-[#090A0A] rounded-[8px] border border-[#FFFFFF1A] backdrop-blur-sm">
                            {selectedTags.map((item) => (
                                <div
                                    key={item.value}
                                    className={`flex items-center gap-2 cursor-pointer h-6 px-3 bg-[#1D1E27] text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border`}
                                    onClick={() => onSelectTag(item.key, item)}
                                >
                                    {t(`characterOptions.labels.${item.label}`)}
                                    <CloseIcon className="w-2 h-2" />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center gap-[18px] h-20 pt-3">
                            <Button
                                shape="round"
                                className="w-[126px]"
                                style={{ background: "#22232A", color: "#ffffff" }}
                                onClick={onClearTags}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                appearance="gradientFill"
                                className="w-[126px]"
                                shape="round"
                                onClick={onDone}
                            >
                                {t('common.confirm')}
                            </Button>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

