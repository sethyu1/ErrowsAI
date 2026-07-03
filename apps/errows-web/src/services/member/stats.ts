import { useMutation } from '@tanstack/react-query';
import { fetchMemberStatsApi } from '@/apis';

export function useMemberStats() {
  const {
    error,
    isPending: loading,
    mutateAsync: statsFn,
  } = useMutation({
    mutationFn: fetchMemberStatsApi,
    onSuccess: (data) => {
      console.log(data);
    },
  });

  return {
    loading,
    error,
    stats: statsFn
  }
}
