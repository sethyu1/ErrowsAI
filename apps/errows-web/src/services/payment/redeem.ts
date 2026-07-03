import { useMutation } from '@tanstack/react-query';
import { redeemApi } from '@/apis';
import { queryClient } from '@/lib/react-query';
import { MEMBER_INFO_KEY } from '@/config/query-keys';

export function useRedeem() {
  const {
    error,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationFn: redeemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_INFO_KEY });
    },
  });

  return {
    loading,
    error,
    redeem: mutateAsync
  }
}
