import { useQuery } from "@tanstack/react-query";
import { fetchCharacterDetailApi } from "@/apis/character";

export function useCharacterDetail(characterId: string) {
    const { data: roleInfo, isLoading } = useQuery({
        queryKey: ["character-detail", characterId],
        queryFn: () => fetchCharacterDetailApi(characterId),
        enabled: !!characterId,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        retry: false,
    });

    return { roleInfo, isLoading }
}