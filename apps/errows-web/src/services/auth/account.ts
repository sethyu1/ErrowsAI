import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUserApi } from '@/apis';
import { useAuthStore } from '@/stores/auth';
import { USER_CURRENT_KEY } from '@/config/query-keys';

export function useAccount(enabled: boolean = false) {
  const { setUser } = useAuthStore(useShallow(state => ({
    setUser: state.setUser,
  })));

  const {
    error,
    data,
    isPending: loading,
    refetch,
  } = useQuery({
    queryKey: [...USER_CURRENT_KEY],
    queryFn: fetchCurrentUserApi,
    staleTime: 0,
    enabled,
  });

  React.useEffect(
    () => {
      if (data) {
        setUser(data);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  return { data, loading, error, refetch };
}
