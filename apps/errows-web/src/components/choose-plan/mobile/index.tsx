import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@errows/design/components/sheet';
import { useTranslation } from 'react-i18next'
import { usePlanList, usePayment } from '@/services/payment';
import { CloseIcon, ArrowRightIcon } from '@errows/icons';
import { cn } from '@errows/design/lib/utils';
import React from 'react';
import { useMemberStore } from '@/stores/member';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@errows/design/components/button';
import type { DateType, MemberType } from '@/types';
import { MEMBER_LIST } from '@/config';
import { Available } from './available';
import { Plan } from './plan';
import { SafePrivacy } from '@/components/safe-privacy';
import { Features, Segment } from '../components';
import { checkPlanRestriction } from '../utils';

interface ChoosePlanDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChoosePlanDrawer(props: ChoosePlanDrawerProps) {
  const { open = false, onOpenChange } = props;
  const { t } = useTranslation();
  const { getFeatures, getPlanInfo } = usePlanList();
  const { openPaymentPlan, paymentPlanLoading } = usePayment();
  const [type, setType] = React.useState<DateType>('yearly');
  const [value, setValue] = React.useState<{ type: DateType; level: MemberType; }>({
    type: 'yearly',
    level: 'star',
  });
  const { info } = useMemberStore(useShallow(state => ({
    info: state.info,
  })));

  const isRestricted = React.useMemo(() => {
    if (!info) return false;
    return checkPlanRestriction(
      info.plan,
      info.plan_type,
      value.level,
      value.type,
      info.valid_until
    );
  }, [info, value.level, value.type]);

  const onPlanClick = (type: DateType, level: MemberType) => {
    setValue({
      type,
      level,
    });
  }

  const onSubscribe = () => {
    const planInfo = getPlanInfo(value.level, value.type);
    if (planInfo) {
      openPaymentPlan(planInfo);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className={cn(
          'z-1000 w-screen h-screen',
          'overflow-y-scroll overflow-x-hidden [&>button]:hidden',
          'bg-[#0b0b10]'
        )}
      >
        <SheetHeader className="hidden">
          <SheetTitle />
          <SheetDescription />
        </SheetHeader>

        <SheetClose asChild>
          <div className="absolute size-6 top-6 left-5">
            <CloseIcon className="size-4" />
          </div>
        </SheetClose>

        <div className="w-full px-3 pt-4">
          <Available
            data={{
              gold: info?.coin_purchased_balance || 0,
              silver: info?.coin_free_balance || 0,
            }}
          />

          <div className="mt-6 font-normal text-center text-lg leading-7 text-[#F5F5F5]">
            {t('auth.chooseYourPlan')}
          </div>

          <div className="mt-4 flex justify-center">
            <Segment value={type} onChange={setType} />
          </div>

          <div className="flex flex-col gap-3 mt-4">
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
                <Plan
                  key={item.level}
                  active={item.level === value?.level && type === value?.type}
                  bset={item.level === 'luna'}
                  dateType={type}
                  data={data}
                  onClick={() => onPlanClick(type, item.level)}
                />
              )
            })}
          </div>

          <Features
            size="sm"
            className="mt-3"
            getFeatures={getFeatures}
            memberType={value?.level}
            dateType={value?.type}
          />

          <div className="h-46" />

          <div
            className="fixed h-30 w-full bottom-0 left-0"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 10%, #000000 86.54%)'
            }}
          >
            <div className="px-14 mt-6">
              <Button
                className="w-full"
                appearance="gradientFill"
                shape="round"
                loading={paymentPlanLoading}
                disabled={isRestricted}
                style={{
                  ...(value?.level === 'luna' && {
                    background: '#FFCE21',
                    color: '#090A0A',
                  }),
                  ...(value?.level === 'star' && {
                    background: '#22232A',
                    border: '1px solid #64656A',
                  }),
                }}
                onClick={onSubscribe}
              >
                <span>{t('auth.subscribeNow')}</span>
                <ArrowRightIcon />
              </Button>
            </div>

            <div className="flex mt-4 w-full justify-center">
              <SafePrivacy size="mini" />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
