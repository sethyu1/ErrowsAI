import { useQuery } from '@tanstack/react-query';
import { fetchMyCharacterImagesByCidApi } from '@/apis';
import { CHARACTER_MY_IMAGES_LIST_KEY } from '@/config/query-keys';

export function useImages(cid: string) {
  const {
    error,
    data,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: [...CHARACTER_MY_IMAGES_LIST_KEY, cid],
    queryFn: async () => {
      return fetchMyCharacterImagesByCidApi(cid);
    },
    enabled: !!cid,
  });

  return { data, loading, error, refetch };
}
