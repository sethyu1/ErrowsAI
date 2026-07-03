import type { MemberItem, DateType } from '@/types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleFilledIcon } from '@errows/icons';
import { ShineBorder } from '@errows/design/components/shine-border';
import { GradientText } from '@/components/gradient-text';
import { MEMBER_CONFIG } from '@/config'
import { Best } from '../components';
import { shineColorConfig, MemberTag } from '../../member';
import { calculatePlanData } from '../utils';

interface PlanProps {
  /** 是否畅销 */
  bset?: boolean;
  /** 日期类型 */
  dateType?: DateType;
  /** 是否选中 */
  active?: boolean;
  showAccess?: boolean;
  /** 计划数据 */
  data: MemberItem;
  onClick?: () => void;
}

export function Plan(props: PlanProps) {
  const {
    bset = false,
    dateType = 'yearly',
    active = false,
    showAccess,
    data,
    onClick
  } = props;
  const { t } = useTranslation();

  const {
    originalPrice,
    price,
    discount,
    discountMoney,
    monthlyMoney
  } = React.useMemo(() => {
    return calculatePlanData(data, dateType);
  }, [dateType, data])

  const memberInfo = MEMBER_CONFIG[data?.level || 'star'];

  return (
    <div
      className="relative cursor-pointer p-3 rounded-2xl bg-[rgba(44,32,63,1)]"
      style={{
        background: memberInfo.background,
      }}
      onClick={onClick}
    >
      <ShineBorder
        borderWidth={2}
        shineColor={shineColorConfig[data?.level || 'star']}
        animate={active}
      />

      <div>
        <span className="text-sm leading-5 font-bold text-[#F5F5F5]">
          <MemberTag
            size="mini"
            type={data?.level}
          />
        </span>
        <GradientText className="h-23 pl-2 text-xs leading-4.5 bg-[rgba(34,35,42,1)]">
          {t('auth.planDiscount', { discount: discount, money: discountMoney })}
        </GradientText>
      </div>

      <div className="mt-1 text-2xl leading-7 font-bold text-white">
        ${monthlyMoney}
        <span className="pl-1.25 text-xs font-bold text-[#A4ACB9]">/{t('auth.perMonth')}</span>
      </div>

      {dateType === 'yearly' && (
        <div className="mt-1 text-xs font-bold text-[#A4ACB9]">
          <span>
            or
          </span>
          <span className="pl-2">
            ${price}/year
          </span>
          <span className="pl-2 line-through">
            ${originalPrice}/year
          </span>
        </div>
      )}

      {dateType === 'monthly' && (
        <div className="mt-1 text-xs font-bold text-[#A4ACB9]">
          <span className="line-through">
            ${originalPrice}/year
          </span>
        </div>
      )}

      {showAccess &&(
        <div className="absolute top-3 right-3">
          <span className="text-xs text-white">basic access</span>
        </div>
      )}

      {bset && (
        <div className="absolute top-3 right-3">
          <Best size="sm" />
        </div>
      )}

      {active && (
        <CheckCircleFilledIcon className="absolute size-3.5 bottom-3 right-3 text-white" />
      )}
    </div>
  )
}
