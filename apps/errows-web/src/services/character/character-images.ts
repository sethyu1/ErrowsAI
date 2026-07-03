import { useQuery } from '@tanstack/react-query';
import { fetchMyCharacterImagesApi } from '@/apis';
import { CHARACTER_MY_IMAGES_KEY } from '@/config/query-keys';

export function useCharacterImages(params: Partial<API.Character.FetchMediaListParams>) {
  const {
    error,
    data,
    isPending: loading,
    refetch,
  } = useQuery({
    queryKey: [...CHARACTER_MY_IMAGES_KEY, params],
    queryFn: async () => {
      return fetchMyCharacterImagesApi(params);
    },
    enabled: !!params,
  });

  return { data, loading, error, refetch };
}
