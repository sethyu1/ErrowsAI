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
import { cn } from "@errows/design/lib/utils";
import { RoleListContent } from "./role-list-content";
import type { Tags } from "../types";
import { useViewportHeight } from "@/hooks/use-viewport-height";

interface RoleSelectorDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

export const RoleSelectorDrawer: React.FC<RoleSelectorDrawerProps> = ({
    open,
    onOpenChange,
    selectedCharacter,
    characters,
    selectedUser,
    searchQuery,
    sort,
    tags,
    isLoading,
    onSelectUser,
    onSearchChange,
    onSortChange,
    onTagFilterOpen,
    onSearchOpen,
    onConfirm,
}) => {
    const { t } = useTranslation();
    const containerHeight = useViewportHeight(72);
    
    return (
        <Drawer
            direction="left"
            handleOnly
            open={open}
            onOpenChange={onOpenChange}
        >
            <DrawerContent
                className={cn(
                    "z-1000 data-[vaul-drawer-direction=left]:w-screen",
                    "bg-[#1b1227]"
                )}
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
                            {t('role.selector.selectCharacter')}
                        </span>
                    </div>
                    <div className="flex flex-col" style={{ height: `${containerHeight}px` }}>
                        <RoleListContent
                            selectedCharacter={selectedCharacter}
                            characters={characters}
                            selectedUser={selectedUser}
                            searchQuery={searchQuery}
                            sort={sort}
                            tags={tags}
                            isLoading={isLoading}
                            onSelectUser={onSelectUser}
                            onSearchChange={onSearchChange}
                            onSortChange={onSortChange}
                            onTagFilterOpen={onTagFilterOpen}
                            onSearchOpen={onSearchOpen}
                            onConfirm={onConfirm}
                        />
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

