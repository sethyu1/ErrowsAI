import type { InputField, GroupedData, GroupedItem } from './types';

/**
 * 将输入字段数组按 key 分组，合并 options 并去重
 */
export function groupFieldsByKey(fields: InputField[]): GroupedData[] {
    const groupedMap = new Map<string, Map<string, GroupedItem>>();

    fields.forEach((field) => {
        const { key, options } = field;

        if (!groupedMap.has(key)) {
            groupedMap.set(key, new Map());
        }

        const itemsMap = groupedMap.get(key)!;

        options.forEach((option) => {
            const { value, title } = option;
            if (!itemsMap.has(value)) {
                itemsMap.set(value, {
                    label: title || value,
                    value: value,
                });
            }
        });
    });

    const result: GroupedData[] = [];
    groupedMap.forEach((itemsMap, key) => {
        result.push({
            key,
            title: fields.find((field) => field.key === key)?.title ?? "",
            items: Array.from(itemsMap.values()),
        });
    });

    return result;
}

export const SORT_OPTIONS_CONFIG = [
    { value: 'latest', labelKey: 'common.latest' },
    { value: 'newest', labelKey: 'role.selector.sortNewest' },
    { value: 'popular', labelKey: 'role.selector.sortPopular' },
    { value: 'most_liked', labelKey: 'role.selector.sortMostLiked' },
    { value: 'alphabetical', labelKey: 'role.selector.sortAlphabetical' },
] as const;

export const STORAGE_KEY = "__role-selector-tags__";

