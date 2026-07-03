import { useState, useEffect, useMemo } from "react";
import { useCharacterOptions } from "@/pages/role/hooks/use-character-options";
import { useModal } from "@/hooks/use-modal";
import { useLocalStorageState } from "ahooks";
import { groupFieldsByKey, STORAGE_KEY } from "../utils";
import type { Tags, GroupedItem } from "../types";

export const useTagFilter = () => {
    const { characterOptions } = useCharacterOptions();
    const tagOptionsModal = useModal<boolean>();
    
    const tagOptions = useMemo(() => {
        return groupFieldsByKey(characterOptions?.options ?? [])?.filter(
            (item) => item.items.length > 0
        );
    }, [characterOptions]);

    const [tags, setTags] = useLocalStorageState<Tags>(STORAGE_KEY, {
        defaultValue: [] as Tags,
    });

    const [selectedTags, setSelectedTags] = useState<
        (GroupedItem & { key: string })[]
    >([]);

    // 当tagOptions加载完成后，初始化selectedTags
    useEffect(() => {
        if (tagOptions.length > 0 && tags.length > 0) {
            const initialTags = tags.flatMap(([key, values]) => 
                values.map((value) => {
                    const item = tagOptions
                        .flatMap(opt => opt.items)
                        .find(i => i.value === value);
                    return { key, value, label: item?.label || value };
                })
            );
            setSelectedTags(initialTags);
        }
    }, [tagOptions, tags]);

    const handleSelectTag = (key: string, item: GroupedItem) => {
        setSelectedTags((prev) => {
            if (prev.some((tag) => tag.key === key && tag.value === item.value)) {
                return prev.filter(
                    (tag) => tag.key !== key || tag.value !== item.value
                );
            } else {
                return [...prev, { key, ...item }];
            }
        });
    };

    const handleClearTags = () => {
        setSelectedTags([]);
    };

    const handleTagDone = () => {
        tagOptionsModal.close();
        const newTags = selectedTags?.reduce((acc, item) => {
            if (acc[item.key]) {
                acc[item.key].push(item.value);
            } else {
                acc[item.key] = [item.value];
            }
            return acc;
        }, {} as Record<string, string[]>);
        setTags(Object.entries(newTags).map(([type, values]) => [type, values]));
    };

    const clearTags = () => {
        setTags([]);
        setSelectedTags([]);
    };

    return {
        tagOptions,
        tags,
        selectedTags,
        tagOptionsModal,
        handleSelectTag,
        handleClearTags,
        handleTagDone,
        clearTags,
    };
};

