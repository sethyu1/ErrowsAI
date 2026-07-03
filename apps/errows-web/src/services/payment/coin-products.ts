import { useQuery } from '@tanstack/react-query';
import { fetchCoinProductsApi } from '@/apis';
import { COIN_PRODUCTS_KEY } from '@/config/query-keys';

/** 金币产品列表 */
export function useCoinProducts() {
  const {
    error,
    data,
    isPending: loading,
    refetch,
  } = useQuery({
    queryKey: [...COIN_PRODUCTS_KEY],
    queryFn: fetchCoinProductsApi,
    staleTime: 0,
  });

  return { data, loading, error, refetch };
}
