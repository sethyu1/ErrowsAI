import React from 'react';
import { useTranslation } from 'react-i18next';
import { GalaxyIcon } from '@errows/icons';
import type { MemberType } from '@/types';
import { useMobile } from '@/hooks/use-mobile-detector';
import { useMemberStore } from '@/stores/member';
import { useGlobalStore } from '@/stores/global';
import { useShallow } from 'zustand/react/shallow';
import { formatDate } from '@/utils';
import { MEMBER_LIST } from '@/config';
import { usePlanList } from '@/services/payment';
import { Level } from './level';
import { Action } from './action';
import { Features } from './features';

export function Plan() {
  const isMobile = useMobile();
  const { t } = useTranslation();
  const { getFeatures } = usePlanList();
  const { info: memberInfo } = useMemberStore(useShallow(state => ({
    info: state.info,
  })));
  const { locale } = useGlobalStore(useShallow(state => ({
    locale: state.locale,
  })));

  const features = React.useMemo(
    () => {
      const list = [];

      if (memberInfo.plan) {
        return getFeatures(memberInfo.plan as MemberType, (memberInfo.plan_type || 'yearly') as API.Payment.PalnType)
      }

      return list;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, memberInfo, getFeatures]
  )

  const memberData = MEMBER_LIST.find(item => item.level === memberInfo?.plan);

  if (isMobile) {
    return (
      <div className="py-6">
        <div className="flex justify-between">
          <div className="flex flex-col text-base font-bold leading-5.5 text-[#FCFCFC]">
            <div>{t('auth.myPlan')}</div>
            {memberInfo?.valid_until && memberInfo.plan && memberInfo.plan !== 'free' && (
              <div className="mt-2">
                {t('auth.expires', { date: formatDate(memberInfo?.valid_until) })}
              </div>
            )}
          </div>

          <Level text={memberData?.title} />
        </div>

        {memberInfo.plan && memberInfo.plan === 'free' && (
          <div className="mt-4 text-[#A4ACB9]">
            <div>{t('auth.noMemberDesc')}！</div>
          </div>
        )}

        {memberInfo.plan && memberInfo.plan !== 'free' && (
          <Features
            className="mt-4"
            list={features}
          />
        )}

        <div className="mt-7 flex justify-center">
          <Action />
        </div>
      </div>
    )
  }

  return (
    <div className="pl-11 pt-6 pr-15 pb-9.5">
      <div className="flex flex-col">
        <div className="flex text-base font-bold leading-5.5 text-[#FCFCFC]">
          <div className="w-23">
            {t('auth.myPlan')}
          </div>
          {memberInfo?.valid_until && memberInfo.plan && memberInfo.plan !== 'free' && (
            <div className="ml-12">
              {t('auth.expires', { date: formatDate(memberInfo?.valid_until) })}
            </div>
          )}
        </div>
        <div className="flex justify-between mt-6">
          <div className="flex">
            <div className="w-23">
              {memberInfo.plan && memberInfo.plan !== 'free' && (
                <>
                  <GalaxyIcon className="size-11.5" />
                  <div>{memberData?.title}</div>
                </>
              )}
            </div>
            {memberInfo.plan && memberInfo.plan === 'free' && (
              <div className="ml-12 text-[#A4ACB9]">
                <div>{t('auth.noMemberDesc')}！</div>
              </div>
            )}
            {memberInfo.plan && memberInfo.plan !== 'free' && (
              <Features
                className="ml-12 flex-1"
                list={features}
              />
            )}
          </div>

          <Action />
        </div>
      </div>
    </div>
  )
}
