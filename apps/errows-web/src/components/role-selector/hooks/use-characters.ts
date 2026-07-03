import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCharacterDiscoverListApi } from "@/apis/character";
import type { Tags } from "../types";

export const useCharacters = (sort: API.Character.FetchListParams['sort'], tags: Tags) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const { data, isLoading, error } = useQuery<{
        data: API.Character.CHARACTER[];
    }>({
        queryKey: ["my-characters", searchQuery, sort, tags],
        queryFn: () => fetchCharacterDiscoverListApi({
            size: 100,
            q: searchQuery,
            sort: sort || 'latest',
            tags: tags.length > 0 ? tags : undefined
        }),
    });

    return { characters: data?.data || [], isLoading, error, searchQuery, setSearchQuery };
};

