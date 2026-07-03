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
import { BackIcon } from "@errows/icons";
import { faqData } from "@/pages/faq/faq-data";
import { cn } from "@errows/design/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface IssueTypeSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedIssueType: string;
    onSelectIssueType: (issueType: string) => void;
}

export const IssueTypeSelector: React.FC<IssueTypeSelectorProps> = ({
    open,
    onOpenChange,
    selectedIssueType,
    onSelectIssueType,
}) => {
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    return (
        <Drawer
            open={open}
            direction="right"
            handleOnly
            onOpenChange={onOpenChange}
        >
            <DrawerContent className="z-1000 data-[vaul-drawer-direction=right]:w-screen bg-[#101018] flex flex-col h-screen">
                <DrawerHeader className="hidden">
                    <DrawerTitle />
                    <DrawerDescription />
                </DrawerHeader>
                <div className="w-full h-full relative">
                    {/* Header */}
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
                            {t("support.chooseType")}
                        </span>
                    </div>

                    {/* Issue Type List */}
                    <div className="flex flex-col p-3">
                        <div className={cn('flex flex-col gap-3 h-[calc(100vh-120px)] pb-3 overflow-y-auto custom-scrollbar', isMobile ? 'pb-30' : '')}>
                            {faqData.map((faq, index) => (
                                <Button
                                    key={index}
                                    onClick={() => {
                                        onSelectIssueType(faq.title);
                                        onOpenChange(false);
                                    }}
                                    variant={selectedIssueType === faq.title ? "default" : "secondary"}
                                    className="w-full justify-start text-left py-3 h-auto"
                                >
                                    {t(`faq.titles.q${index + 1}`)}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

