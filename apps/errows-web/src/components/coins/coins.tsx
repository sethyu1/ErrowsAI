import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { useMemberStore } from '@/stores/member';
import { useShallow } from 'zustand/react/shallow';
import { Loading } from '@/components/loading';
import {
  Field,
  FieldError,
  FieldSet,
  FieldLabel,
} from '@errows/design/components/field';
import { Spinner } from '@errows/design/components/spinner';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@errows/design/components/input-group';
import {
  Button,
} from '@errows/design/components/button';
import { ScrollArea } from '@errows/design/components/scroll-area';
import { useRedeem } from '@/services/payment';
import { useCoinProducts } from '@/services/payment';
import { Notification } from '@/components/notification';
import { usePayment } from '@/services/payment'
import { cn } from '@errows/design/lib/utils';
import { useTask } from '@/services/task';
import { Available, PricePackage, Tabs, TaskCard } from './componnets';
import { z } from 'zod';

interface CoinsProps {
  isPage?: boolean;
  showAvailable?: boolean;
}

export function Coins(props: CoinsProps) {
  const { isPage = false,showAvailable = true } = props;
  const { t } = useTranslation();

  const { tasks } = useTask();
  const [active, setActive] = React.useState('charge');
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const { info } = useMemberStore(useShallow(state => ({
    info: state.info,
  })));
  const { redeem, loading: redeemLoading } = useRedeem();
  const { data: list = [] } = useCoinProducts();
  const { productId, openPaymentCoin, paymentCoinLoading } = usePayment();

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

  return (
    <div>
      <Tabs
        items={[
          { key: 'charge', label: t('auth.charge') },
          { key: 'earn', label: t('auth.earn') },
        ]}
        activeKey={active}
        onChange={setActive}
      />

      {showAvailable && (
        <Available
          className="mt-3 px-6"
          data={{
            gold: info?.coin_purchased_balance || 0,
            silver: info?.coin_free_balance || 0,
          }}
        />
      )}

      {active === 'charge' && (
        <div className="mt-8 px-6 pb-6 flex flex-col gap-3">
          {list.length === 0 && (
            <div className="flex items-center justify-center h-80">
              <Loading
                className="text-4xl"
              />
            </div>
          )}
          {list.length > 0 && (
            <>
              {list.map((item, index) => {
                return (
                  <PricePackage
                    key={item.id || index}
                    data={item}
                    loading={!!(productId && productId === item.id && paymentCoinLoading)}
                    disabled={!!(productId && productId !== item.id && paymentCoinLoading)}
                    onClick={handleOpenPlay}
                  />
                )
              })}
            </>
          )}
        </div>
      )}

      {active === 'earn' && (
        <div
          className="relative pt-3"
        >
          <ScrollArea
            type="scroll"
            className={cn('flex gap-3', isPage ? 'h-[calc(90vh-180px)]' : 'h-80')}
          >
            <div className="flex flex-col mt-9 px-6 pb-5 gap-3">
              {tasks.map(item => {
                return (
                  <TaskCard
                    key={item.id}
                    data={item}
                    progress={`${item.progress}/${item.goal}`}
                  />
                )
              })}
              <div className="flex gap-2 px-6 py-4 box-border w-full bg-[#2C2C38]/70 border border-white/10 backdrop-blur-[2px] rounded-2xl flex-col">
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
                            <FieldLabel className="text-xl text-[#F5F5F5]" htmlFor="key">CD-key {t('auth.exchange')}</FieldLabel>
                            <InputGroup className="rounded-full pr-0.5 dark:bg-[rgba(9,10,10,1)]">
                              <InputGroupInput
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                type="text"
                                onChange={(e) => field.handleChange(e.target.value)}
                                aria-invalid={isInvalid}
                                autoComplete="off"
                                placeholder={t('auth.exchangePlaceholder')}
                              />
                              <InputGroupAddon className="px-0">
                                <Button
                                  appearance="gradientOutline"
                                  disabled={redeemLoading}
                                  className="cursor-pointer h-7.5"
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
          </ScrollArea>
          {!isPage && (
            <div
              className="absolute bottom-0 left-0 w-full h-7"
              style={{
                background:`linear-gradient(180deg, rgba(27, 18, 39, 0) 0%, #1B1227 88.46%)`,
              }}
            />
          )}
        </div>
      )}

      <Notification
        open={openSuccess}
        title="Success!"
        description={successMessage ?? undefined}
        onOpenChange={(open) => {
          setOpenSuccess(open);
          if (!open) setSuccessMessage(null);
        }}
      />
    </div>
  )
}
