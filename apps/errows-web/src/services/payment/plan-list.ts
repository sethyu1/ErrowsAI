import type { MemberType, DateType } from '@/types';
import React from 'react';
import i18n from '@/lib/i18n';
import { useShallow } from 'zustand/react/shallow';
import { useQuery } from '@tanstack/react-query';
import { fetchPlansApi } from '@/apis';
import { PLAN_LIST_KEY } from '@/config/query-keys';
import { useGlobalStore } from '@/stores/global';

function getMemberFeatures(member: MemberType, options: { chats: number; coins: number }) {
  const featuresMap: Record<MemberType, string[]> = {
    star: [
      i18n.t('auth.planDesc1', { total: options.coins }),
      i18n.t('auth.planDesc2'),
      i18n.t('auth.planDesc3'),
      i18n.t('auth.planDesc4'),
      i18n.t('auth.planDesc5'),
    ],
    luna: [
      i18n.t('auth.planDesc1', { total: options.coins }),
      i18n.t('auth.planDesc2'),
      i18n.t('auth.planDesc6', { total: options.chats }),
      i18n.t('auth.planDesc8'),
      i18n.t('auth.planDesc9'),
      i18n.t('auth.planDesc3'),
      i18n.t('auth.planDesc4'),
      i18n.t('auth.planDesc5'),
      i18n.t('auth.planDesc11'),
    ],
    galaxy: [
      i18n.t('auth.planDesc1', { total: options.coins }),
      i18n.t('auth.planDesc2'),
      i18n.t('auth.planDesc7'),
      i18n.t('auth.planDesc8'),
      i18n.t('auth.planDesc10'),
      i18n.t('auth.planDesc11'),
      i18n.t('auth.planDesc9'),
      i18n.t('auth.planDesc12'),
      i18n.t('auth.planDesc4'),
      i18n.t('auth.planDesc5'),
    ]
  };

  return featuresMap[member];
}

/** 订阅计划列表 */
export function usePlanList() {
  const { locale } = useGlobalStore(useShallow(state => ({
    locale: state.locale,
  })));

  const {
    error,
    data,
    isPending: loading,
    refetch,
  } = useQuery({
    queryKey: [...PLAN_LIST_KEY],
    queryFn: fetchPlansApi,
  });

  const getFeatures = React.useCallback(
    (memberType: MemberType, type: API.Payment.PalnType) => {
      const info = data?.find(item => item.type === type && item.name === memberType);

      return getMemberFeatures(memberType, {
        coins: info?.bonus_coin || 0,
        chats: 3000,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, data]
  );

  const getPlanInfo = (memberType: MemberType, type: DateType) => {
    return data?.find(item => item.type === type && item.name === memberType);
  }

  return {
    data,
    loading,
    error,
    refetch,
    getFeatures,
    getPlanInfo,
  };
}
