import React from 'react';
import { useTranslation } from 'react-i18next';
import type { DateType } from '@/types';
import { usePlanList } from '@/services/payment';
import { ChoosePlan as ChoosePlanCom } from './choose-plan';
import { Segment } from './components';
import { MEMBER_LIST } from '@/config';

export function ChoosePlanPage() {
  const { t } = useTranslation();
  const [type, setType] = React.useState<DateType>('yearly');
  const { getFeatures, getPlanInfo } = usePlanList();

  return (
    <div>
      <div className="mb-5 text-3xl font-bold text-center">
        {t('sidebar.membership')}
      </div>
      <div className="flex justify-center">
        <Segment value={type} onChange={setType} />
      </div>

      <div className="flex mt-5 p-3 gap-6 rounded-2xl">
        {MEMBER_LIST.map(item => {
          const yearlyInfo = getPlanInfo(item.level, 'yearly');
          const monthlyInfo = getPlanInfo(item.level, 'monthly');

          const data = {
            ...item,
            yearly: {
              ...item.yearly,
              originalPrice: yearlyInfo?.before_discount_price || 0,
              discount: yearlyInfo?.discount_rate || 0,
              price: yearlyInfo?.price || 0,
            },
            monthly: {
              ...item.monthly,
              originalPrice: monthlyInfo?.before_discount_price || 0,
              discount: monthlyInfo?.discount_rate || 0,
              price: monthlyInfo?.price || 0,
            }
          }

          return (
            <ChoosePlanCom
              key={item.level}
              bset={item.level === 'luna'}
              dateType={type}
              data={data}
              info={(type === 'yearly' ? yearlyInfo : monthlyInfo)}
              getFeatures={getFeatures}
            />
          )
        })}
      </div>
    </div>
  )
}
