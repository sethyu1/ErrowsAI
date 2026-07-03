import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCharacterImageGenerationOptionsApi } from "@/apis/character";
import { groupBy } from '@/utils'

// 缓存7天
const CACHE_TIME = 7 * 24 * 60 * 60 * 1000;

export function useImageGenerationOptions( ): {
    options: Record<API.Character.CHARACTER['gender'], API.Character.ImageGenerationOptions[]>;
    isLoading: boolean;
} {
    const { data: options, isLoading } = useQuery({
        queryKey: ["character-image-generation-options"],
        queryFn: () => fetchCharacterImageGenerationOptionsApi(),
        staleTime: CACHE_TIME,  
        gcTime: CACHE_TIME, 
    });

    // 缓存 groupBy 的结果，使引用稳定
    const memoizedOptions = useMemo(() => {
        return groupBy(options as API.Character.ImageGenerationOptions[] || [], 'gender');
    }, [options]);

    return { 
        options: memoizedOptions, 
        isLoading 
    }
}