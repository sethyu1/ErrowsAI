import type { MemberItem, DateType } from '@/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@errows/design/components/button';
import { ArrowRightIcon } from '@errows/icons';
import { ShineBorder } from '@errows/design/components/shine-border';
import { MEMBER_CONFIG } from '@/config';
import { usePayment } from '@/services/payment';
import { useMemberStore } from '@/stores/member';
import { useShallow } from 'zustand/react/shallow';
import { Features, type FeatureProps } from './components';
import { shineColorConfig } from '../member';
import { MemberTag } from '../member';
import { calculatePlanData, checkPlanRestriction } from './utils';

interface PlanProps {
  /** 是否畅销 */
  bset?: boolean;
  /** 日期类型 */
  dateType?: DateType;
  /** 计划数据 */
  data: MemberItem;
  info?: API.Payment.PalnInfo;
  onClick?: () => void;
  /** 订阅购买 */
  onSubscribe?: () => void;
  getFeatures: FeatureProps['getFeatures'];
}

export function ChoosePlan(props: PlanProps) {
  const [active, setActive] = React.useState(false);
  const { t } = useTranslation();
  const { productId, openPaymentPlan, paymentPlanLoading } = usePayment();
  const {
    bset = false,
    dateType = 'yearly',
    data,
    info,
    onClick,
    getFeatures,
  } = props;

  const { memberStoreInfo } = useMemberStore(useShallow(state => ({
    memberStoreInfo: state.info,
  })));

  const memberInfo = MEMBER_CONFIG[data?.level || 'star'];

  const handleSubscribe = (data: API.Payment.PalnInfo) => {
    if (data) {
      openPaymentPlan(data);
    }
  }

  const onMouseEnter = () => {
    setActive(true);
  }

  const onMouseLeave = () => {
    setActive(false);
  }

  const {
    originalPrice,
    price,
    discount,
    discountMoney,
    monthlyMoney
  } = React.useMemo(() => {
    return calculatePlanData(data, dateType);
  }, [dateType, data])

  const isRestricted = React.useMemo(() => {
    if (!memberStoreInfo) return false;
    return checkPlanRestriction(
      memberStoreInfo.plan,
      memberStoreInfo.plan_type,
      data.level,
      dateType,
      memberStoreInfo.valid_until
    );
  }, [memberStoreInfo, data.level, dateType]);

  return (
    <div
      className="relative w-81.5 h-160 px-5 pt-12 rounded-2xl border border-white/20 bg-[rgba(255,255,255,0.04)]"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: memberInfo.background,
      }}
    >
      <ShineBorder
        borderWidth={2}
        shineColor={shineColorConfig[data?.level || 'star']}
        animate={active}
      />

      {bset && (
        <div className="absolute h-6 w-25 top-4 left-5 text-sm font-bold leading-6">
          <div
            className="w-full h-full rounded-full text-center"
          >
            <ShineBorder shineColor={shineColorConfig.galaxy} />
            {t('auth.bestSeller')}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="text-base text-[#F5F5F5]">
          <span className="text-3xl font-bold text-[rgba(245,245,245,1)]">
            <MemberTag type={data?.level} />
          </span>
          <span className="p-2">
            {t('auth.planDiscount', { discount: discount, money: discountMoney })}
          </span>
        </div>
        <div>
          <span className="text-[32px] leading-10 font-bold">
            ${monthlyMoney}
          </span>
          <span className="p-2">/{t('auth.perMonth')}</span>
        </div>

        {dateType === 'yearly' && (
          <div className="flex gap-2">
            <span>{t('common.or')}</span>
            <span>${price}/{t('auth.yearly')}</span>
            <span className="line-through">${originalPrice}/{t('auth.yearly')}</span>
          </div>
        )}

        {dateType === 'monthly' && (
          <div className="flex gap-2">
            <span className="line-through">${originalPrice}/{t('auth.monthly')}</span>
          </div>
        )}

        <Button
          className="cursor-pointer h-13 mt-3.5 w-full"
          appearance="gradientFill"
          shape="round"
          loading={!!(productId && productId === info?.id && paymentPlanLoading)}
          disabled={!!(productId && productId !== info?.id && paymentPlanLoading) || isRestricted}
          style={{
            ...(data?.level === 'luna' && {
              background: '#FFCE21',
              color: '#090A0A',
            }),
            ...(data?.level === 'star' && {
              background: '#22232A',
              border: '1px solid #64656A',
            }),
          }}
          onClick={() => { handleSubscribe(info!) }}
        >
          <span>{t('auth.subscribeNow')}</span>
          <ArrowRightIcon />
        </Button>
      </div>

      <Features
        className="mt-4"
        size="sm"
        dateType={dateType}
        memberType={data?.level}
        getFeatures={getFeatures}
      />
    </div>
  )
}
