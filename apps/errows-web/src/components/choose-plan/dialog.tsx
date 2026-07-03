import React from 'react';
import { useTranslation } from 'react-i18next'
import type { DateType } from '@/types';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from '@errows/design/components/dialog';
import { usePlanList } from '@/services/payment';
import { SafePrivacy } from '@/components/safe-privacy';
import { ChoosePlan as ChoosePlanCom } from './choose-plan';
import { Segment } from './components';
import { MEMBER_LIST } from '@/config';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChoosePlanDialogProps extends React.ComponentProps<typeof Dialog> {}

export function ChoosePlanDialog(props: ChoosePlanDialogProps) {
  const [type, setType] = React.useState<DateType>('yearly');
  const { t } = useTranslation();
  const { getFeatures, getPlanInfo } = usePlanList();

  return (
    <Dialog {...props}>
      <DialogContent
        className="w-auto max-h-[90vh] p-0 z-1000 rounded-2xl bg-[rgba(30,26,39,1)]"
        style={{
          border: '1px solid rgba(255, 255, 255, 10%)',
          backgroundColor: '#0E0F17',
          maxWidth: 'unset'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center pt-8">
            {t('auth.chooseYourPlan')}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <div className="flex justify-center">
            <Segment value={type} onChange={setType} />
          </div>

          <div className="flex py-3 px-6 gap-6 rounded-2xl max-h-[calc(90vh-180px)] overflow-y-auto">
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

          <div className="py-4 flex justify-center">
            <SafePrivacy />
          </div>

          <div
            className="absolute bottom-11 left-0 w-full h-7"
            style={{
              background:`linear-gradient(180deg, rgba(27, 18, 39, 0) 0%, rgba(30,26,39,1 100%)`,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
