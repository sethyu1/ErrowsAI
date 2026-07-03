import React from 'react';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { useForm } from '@tanstack/react-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from '@errows/design/components/dialog';
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
} from '@errows/design/components/field';
import { Spinner } from '@errows/design/components/spinner';
import { useShallow } from 'zustand/react/shallow';
import { getGenderEnum } from '@/config/config';
import { useAuthStore } from '@/stores/auth';
import { useGlobalStore } from '@/stores/global';
import { Input } from '@errows/design/components/input';
import { Button } from '@errows/design/components/button';
import { Select } from '@/components';
import { useUpdateAccount } from '@/services/auth';

interface ChangeProps extends React.ComponentProps<typeof Dialog> {
  showItem?: string;
  onClose?: () => void;
}

const formSchema = z.object({
  name: z.string(),
  gender: z.string(),
});

const GenderEnum = getGenderEnum();

export function Change(props: ChangeProps) {
  const { showItem, onClose } = props;
  const { t } = useTranslation();
  const { updateAccount, loading } = useUpdateAccount();
  const { user } = useAuthStore(useShallow(state => ({
    user: state.user,
  })));
  const { locale } = useGlobalStore(useShallow(state => ({
    locale: state.locale,
  })));

  const opts = React.useMemo(
    () => {
      const GenderEnum = getGenderEnum();
      return GenderEnum.toList();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  )

  const form = useForm({
    defaultValues: {
      name: user?.name,
      gender: user?.profile?.gender || GenderEnum.UNKNOWN,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      updateAccount(value as API.User.UpdateProfileData)
        .then(() => {
          onClose?.();
        });
    }
  });

  return (
    <Dialog {...props}>
      <DialogContent
        className="w-120 z-3000 rounded-2xl overflow-hidden bg-[rgba(30,26,39,1)]"
        style={{
          border: '1px solid rgba(255, 255, 255, 10%)',
          backgroundColor: 'rgba(27,18,39,1)',
        }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="hidden" />
          <DialogDescription className="hidden" />
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <FieldGroup>
              {(showItem === 'name' || !showItem) && (
                <form.Field
                  name="name"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field>
                        <FieldLabel>
                          {t('auth.nickname')}
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          type="text"
                          className="rounded-full dark:bg-[rgba(9,10,10,1)]"
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Nickname"
                          autoComplete="off"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
              )}

              {(showItem === 'gender' || !showItem) && (
                <form.Field
                  name="gender"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field>
                        <FieldLabel>
                          {t('auth.gender')}
                        </FieldLabel>
                        <Select
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          type="single"
                          options={opts}
                          onValueChange={(value) => { field.handleChange(value); }}
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
              )}
            </FieldGroup>

            <Field orientation="horizontal">
              <div className="flex w-full justify-center gap-4">
                <Button
                  variant="outline"
                  type="reset"
                  className="w-30 cursor-pointer"
                  shape="round"
                  onClick={onClose}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="w-30 cursor-pointer"
                  appearance="gradientFill"
                  shape="round"
                  disabled={loading}
                >
                  {loading && <Spinner />}
                  {t('common.save')}
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
