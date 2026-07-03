import React, { useState, forwardRef, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarImage, Select, SelectTrigger, SelectValue } from "@errows/design";
import { useMobile } from "@/hooks/use-mobile-detector";
import { cn } from "@errows/design/lib/utils";
import { useCharacters } from "./hooks/use-characters";
import { useTagFilter } from "./hooks/use-tag-filter";
import { RoleSelectorDialog } from "./components/role-selector-dialog";
import { RoleSelectorDrawer } from "./components/role-selector-drawer";
import { TagFilterDialog } from "./components/tag-filter-dialog";
import { TagFilterDrawer } from "./components/tag-filter-drawer";
import { RoleSearchDrawer } from "./components/role-search-drawer";
import { useModal } from "@/hooks/use-modal";
import type { RoleSelectorProps, RoleSelectorRef } from "./types";

export type { RoleSelectorProps, RoleSelectorRef } from "./types";

export const RoleSelector = forwardRef<RoleSelectorRef, RoleSelectorProps>(({
    defaultRoleId,
    noTrigger = false,
    onConfirm
}, ref) => {
    const { t } = useTranslation();
    const isMobile = useMobile();
    const [selectedUser, setSelectedUser] = useState<string>(defaultRoleId || '');
    const [open, setOpen] = useState<boolean>(false);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [sort, setSort] = useState<API.Character.FetchListParams['sort']>('latest');
    
    const {
        tagOptions,
        tags,
        selectedTags,
        tagOptionsModal,
        handleSelectTag,
        handleClearTags,
        handleTagDone,
        clearTags,
    } = useTagFilter();

    const searchModal = useModal<boolean>();

    const { characters, searchQuery, setSearchQuery, isLoading } = useCharacters(sort, tags);

    const selectedCharacter = characters?.find((c: API.Character.CHARACTER) => c.id === selectedUser);

    const handleConfirm = () => {
        onConfirm?.(selectedUser);
        setOpen(false);
        setDrawerOpen(false);
    };

    useImperativeHandle(ref, () => ({
        open: () => { 
            // 清空搜索和tags
            setSearchQuery('');
            clearTags();
            if (isMobile) {
                setDrawerOpen(true);
            } else {
                setOpen(true);
            }
        },
        close: () => { 
            setOpen(false);
            setDrawerOpen(false);
        },
    }), [isMobile, clearTags, setSearchQuery]);

    return (
        <>
            {isMobile && (
                <Select
                    value={selectedUser}
                    onValueChange={() => {
                        // 清空搜索和tags
                        setSearchQuery('');
                        clearTags();
                        setDrawerOpen(true);
                    }}
                    open={false}
                >
                    <SelectTrigger 
                        className={cn("w-[200px]", noTrigger ? "w-full opacity-0" : "")}
                        onClick={() => {
                            // 清空搜索和tags
                            setSearchQuery('');
                            clearTags();
                            setDrawerOpen(true);
                        }}
                    >
                        <SelectValue placeholder={t('role.selector.selectCharacter')}>
                            {selectedCharacter ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="size-6">
                                        <AvatarImage
                                            src={selectedCharacter.avatar_url}
                                        />
                                    </Avatar>
                                    <span>{selectedCharacter.nickname}</span>
                                </div>
                            ) : (
                                <span>{t('role.selector.selectCharacter')}</span>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                </Select>
            )}

            {/* PC端 Dialog */}
            {!isMobile && (
                <RoleSelectorDialog
                    open={open}
                    onOpenChange={setOpen}
                    selectedCharacter={selectedCharacter}
                    characters={characters}
                    selectedUser={selectedUser}
                    searchQuery={searchQuery}
                    sort={sort}
                    tags={tags}
                    isLoading={isLoading}
                    onSelectUser={setSelectedUser}
                    onSearchChange={setSearchQuery}
                    onSortChange={setSort}
                    onTagFilterOpen={() => tagOptionsModal.open()}
                    onSearchOpen={() => searchModal.open()}
                    onConfirm={handleConfirm}
                />
            )}

            {/* 移动端 Drawer */}
            {isMobile && (
                <RoleSelectorDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    selectedCharacter={selectedCharacter}
                    characters={characters}
                    selectedUser={selectedUser}
                    searchQuery={searchQuery}
                    sort={sort}
                    tags={tags}
                    isLoading={isLoading}
                    onSelectUser={setSelectedUser}
                    onSearchChange={setSearchQuery}
                    onSortChange={setSort}
                    onTagFilterOpen={() => tagOptionsModal.open()}
                    onSearchOpen={() => searchModal.open()}
                    onConfirm={handleConfirm}
                />
            )}

            {/* 移动端搜索 Drawer */}
            {isMobile && (
                <RoleSearchDrawer
                    visible={searchModal?.visible}
                    close={searchModal.close}
                    sort={sort}
                    tags={tags}
                    selectedUser={selectedUser}
                    onSelectUser={setSelectedUser}
                    onConfirm={handleConfirm}
                />
            )}

            {/* PC端 Tag筛选 Dialog */}
            {!isMobile && (
                <TagFilterDialog
                    open={tagOptionsModal?.visible}
                    onOpenChange={tagOptionsModal.close}
                    tagOptions={tagOptions}
                    selectedTags={selectedTags}
                    onSelectTag={handleSelectTag}
                    onClearTags={handleClearTags}
                    onDone={handleTagDone}
                />
            )}

            {/* 移动端 Tag筛选 Drawer */}
            {isMobile && (
                <TagFilterDrawer
                    open={tagOptionsModal?.visible}
                    onOpenChange={tagOptionsModal.close}
                    tagOptions={tagOptions}
                    selectedTags={selectedTags}
                    onSelectTag={handleSelectTag}
                    onClearTags={handleClearTags}
                    onDone={handleTagDone}
                />
            )}
        </>
    );
});
