import React from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@errows/design";
import { RoleListContent } from "./role-list-content";
import type { Tags } from "../types";

interface RoleSelectorDialogProps {
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

export const RoleSelectorDialog: React.FC<RoleSelectorDialogProps> = ({
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
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="rounded-2xl overflow-hidden bg-[rgba(30,26,39,1)] z-10001 flex flex-col"
                style={{
                    border: '1px solid rgba(255, 255, 255, 10%)',
                    backgroundColor: 'rgba(27,18,39,1)',
                    padding: 0,
                    width: '800px',
                    maxWidth: 'unset',
                    height: '600px',
                    maxHeight: '90vh'
                }}
            >
                <DialogHeader className='shrink-0'>
                    <DialogTitle className="text-center pt-4">
                        {t('role.selector.selectCharacter')}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 flex flex-col">
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
            </DialogContent>
        </Dialog>
    );
};

