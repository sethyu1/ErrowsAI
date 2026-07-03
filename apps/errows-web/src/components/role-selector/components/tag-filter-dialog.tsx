import React from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Button,
} from "@errows/design";
import { CloseIcon } from "@errows/icons";
import type { GroupedData, GroupedItem } from "../types";

interface TagFilterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tagOptions: GroupedData[];
    selectedTags: (GroupedItem & { key: string })[];
    onSelectTag: (key: string, item: GroupedItem) => void;
    onClearTags: () => void;
    onDone: () => void;
}

export const TagFilterDialog: React.FC<TagFilterDialogProps> = ({
    open,
    onOpenChange,
    tagOptions,
    selectedTags,
    onSelectTag,
    onClearTags,
    onDone,
}) => {
    const { t } = useTranslation();
    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
            modal
        >
            <DialogContent className="w-[800px] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#0A0A0F] border-[#2C2C38] z-10003">
                <DialogHeader>
                    <DialogTitle className="text-white">{t('role.selector.filter')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 h-[400px] overflow-y-auto scrollbar-hide relative">
                    {tagOptions.map((item) => (
                        <div key={item.key} className="flex flex-col gap-4">
                            <div className="text-[#A4ACB9] text-[14px] font-medium font-roboto leading-[16px]">
                            {t(`characterOptions.titles.${item.key}`)}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {item.items.map((c) => {
                                    const isSelected = selectedTags.some(
                                        (tag) => tag.key === item.key && tag.value === c.value
                                    );
                                    return (
                                        <div
                                            key={c.value}
                                            className={`cursor-pointer h-6 px-3 text-[#ffffff] rounded-[4px] text-[14px] font-medium font-urbanist leading-[24px] border ${
                                                isSelected ? "border-white" : "border-[#FFFFFF1A]"
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
                        className="sticky bottom-[-4px] min-h-7 left-0 right-0 w-full pointer-events-none h-7"
                        style={{
                            background:
                                "linear-gradient(180deg, rgba(27, 18, 39, 0) 0%, #1B1227 88.46%)",
                        }}
                    />
                </div>

                <div className="flex flex-wrap justify-start gap-2 h-[144px] overflow-y-auto p-5 bg-[#090A0A] rounded-[8px] border border-[#FFFFFF1A] backdrop-blur-sm">
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
                <div className="flex justify-center gap-[18px]">
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
            </DialogContent>
        </Dialog>
    );
};

