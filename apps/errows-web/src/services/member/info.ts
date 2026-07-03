import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useQuery } from '@tanstack/react-query';
import { fetchMemberInfoApi } from '@/apis';
import { useMemberStore } from '@/stores/member';
import { useAuthStore } from '@/stores/auth';
import { MEMBER_INFO_KEY } from '@/config/query-keys';

export function useMemberInfo(enabled: boolean = false) {
  const token = useAuthStore((s) => s.token);
  const { setInfo } = useMemberStore(useShallow(state => ({
    setInfo: state.setInfo,
  })));

  const {
    error,
    data,
    isPending: loading,
    refetch,
  } = useQuery({
    queryKey: [...MEMBER_INFO_KEY, enabled && token ? token : ''],
    queryFn: fetchMemberInfoApi,
    staleTime: 0,
    enabled,
  });

  React.useEffect(
    () => {
      if (data) {
        setInfo(data);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  return { data, loading, error, refetch };
}
