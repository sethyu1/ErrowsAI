import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@errows/design/components/drawer';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@errows/design/components/input-group';
import { useTask } from '@/services/task';
import { usePayment } from '@/services/payment';
import { Notification } from '@/components/notification';
import {
  Field,
  FieldError,
  FieldSet,
  FieldLabel,
} from '@errows/design/components/field';
import { useCoinProducts } from '@/services/payment';
import { Button } from '@errows/design/components/button';
import { Spinner } from '@errows/design/components/spinner';
import { useMemberStore } from '@/stores/member';
import { useShallow } from 'zustand/react/shallow';
import { CloseIcon } from '@errows/icons';
import { cn } from '@errows/design/lib/utils';
import { useRedeem } from '@/services/payment';
import { Available, Tabs } from './componnets';
import { PricePackage, TaskCard } from './mobile';
import { z } from 'zod';

interface CoinsDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CoinsDrawer(props: CoinsDrawerProps) {
  const { open = false, onOpenChange } = props;
  const { t } = useTranslation();
  const { tasks, tasksRefetch } = useTask();
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [active, setActive] = React.useState('charge');
  const { info } = useMemberStore(useShallow(state => ({
    info: state.info,
  })));
  const { redeem, loading: redeemLoading } = useRedeem();
  const { data: list = [] } = useCoinProducts();
  const { productId, openPaymentCoin, paymentCoinLoading } = usePayment();

  // 每次打开抽屉时重置为 charge tab
  React.useEffect(() => {
    if (open) {
      setActive('charge');
    }
  }, [open]);

  const handleOpenPlay = (data: API.Payment.CoinProductInfo) => {
    openPaymentCoin(data);
  }

  const formSchema = z.object({
    key: z
      .string()
      .min(1, t('auth.verifyKeyRequired'))
      .min(8, t('auth.verifyKeyFormat'))
      .max(30, t('auth.verifyKeyFormat'))
      .regex(/^[0-9A-Za-z]{8,30}$/, t('auth.verifyKeyFormat')),
  });

  const form = useForm({
    defaultValues: {
      key: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      const key = typeof value === 'string' ? value : (value?.key ?? '');
      redeem({ key }).then((res) => {
        form.reset();
        setSuccessMessage(res?.message ?? null);
        setOpenSuccess(true);
      });
    }
  });

  const handleTabsChange = (key: string) => {
    if (key === 'earn') {
      tasksRefetch();
    }
    setActive(key);
  }

  return (
    <Drawer
      direction="right"
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent
        className={cn(
          'z-1000 data-[vaul-drawer-direction=right]:w-screen',
          'bg-[#0b0b10] flex flex-col h-full overflow-hidden'
        )}
      >
        <DrawerHeader className="hidden">
          <DrawerTitle />
          <DrawerDescription />
        </DrawerHeader>

        <DrawerClose asChild>
          <div className="absolute flex items-center justify-center size-6 top-6 left-5">
            <CloseIcon className="size-4" />
          </div>
        </DrawerClose>

        <Available
          className="mt-6 px-6 flex-shrink-0"
          data={{
            gold: info?.coin_purchased_balance || 0,
            silver: info?.coin_free_balance || 0,
          }}
        />

        <Tabs
          items={[
            { key: 'charge', label: t('auth.charge') },
            { key: 'earn', label: t('auth.earn') },
          ]}
          className="mt-6 flex-shrink-0"
          activeKey={active}
          onChange={handleTabsChange}
        />

        <div className="px-3 flex-1 overflow-y-auto pb-10 min-h-0">
          {active === 'charge' && (
            <div className="mt-3 flex flex-col gap-3">
              {list.map((item, index) => {
                return (
                  <PricePackage
                    data={item}
                    key={item.id || index}
                    loading={!!(productId && productId === item.id && paymentCoinLoading)}
                    disabled={!!(productId && productId !== item.id && paymentCoinLoading)}
                    onClick={handleOpenPlay}
                  />
                )
              })}
            </div>
          )}

          {active === 'earn' && (
            <div className="mt-3">
              <div className="flex flex-col gap-3">
                {tasks.map(item => {
                  return (
                    <TaskCard
                      key={item.id}
                      data={item}
                      progress={`${item.progress}/${item.goal}`}
                    />
                  )
                })}
              </div>

              <div className="flex flex-col gap-2 mt-4 px-0 py-4 box-border w-full bg-[#2C2C38]/70 border border-white/10 backdrop-blur-[2px] rounded-2xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                  }}
                >
                  <FieldSet>
                    <form.Field
                      name="key"
                      children={(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                        return (
                          <Field>
                            <FieldLabel className="text-xl text-[#F5F5F5]" htmlFor="username">CD-key {t('auth.exchange')}</FieldLabel>
                            <InputGroup className="rounded-2xl">
                              <InputGroupInput
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                type="text"
                                className="rounded-full dark:bg-[rgba(9,10,10,1)]"
                                onChange={(e) => field.handleChange(e.target.value)}
                                aria-invalid={isInvalid}
                                autoComplete="off"
                                placeholder={t('auth.exchangePlaceholder')}
                              />
                              <InputGroupAddon className="px-0">
                                <Button
                                  appearance="gradientOutline"
                                  disabled={redeemLoading}
                                  className="cursor-pointer"
                                  type="submit"
                                  shape="round"
                                >
                                  {redeemLoading && <Spinner />}
                                  {t('auth.exchange')}
                                </Button>
                              </InputGroupAddon>
                            </InputGroup>
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    />
                  </FieldSet>
                </form>
              </div>
            </div>
          )}
        </div>

        <Notification
          open={openSuccess}
          title={t('common.exchangeSuccessful')}
          description={successMessage ?? undefined}
          onOpenChange={(open) => {
            setOpenSuccess(open);
            if (!open) setSuccessMessage(null);
          }}
        />
      </DrawerContent>
    </Drawer>
  )
}
