import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from '@errows/design/components/dialog';
import { Spinner } from '@errows/design/components/spinner'
import {
  Field,
  FieldError,
  FieldGroup,
} from '@errows/design/components/field';
import { useGlobalServer } from '@/hooks/use-global-server';
import { InputPassword } from '@/components';
import { useUpdatePassword } from '@/services/auth';
import { Button } from '@errows/design/components/button';
import * as z from 'zod';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChangePasswordProps extends React.ComponentProps<typeof Dialog> {}

export function ChangePassword(props: ChangePasswordProps) {
  const { updatePassword, loading } = useUpdatePassword();
  const { setOpenChangePassword } = useGlobalServer();
  const { t } = useTranslation();

  const formSchema = z
    .object({
      password: z
        .string()
        .min(1, t('auth.verifyPasswordRequired'))
        .min(6, t('auth.verifyPasswordMinLength')),
      confirmPassword: z.string(),
    })
    .refine(
      (data) => data.password === data.confirmPassword,
      {
        message: t('auth.verifyConfirmPassword'),
        path: ['confirmPassword'], // 错误信息关联到confirmPassword字段
      }
    );


  const form = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      updatePassword({ password: value.password });
    }
  })

  return (
    <Dialog {...props}>
      <DialogContent
        className="w-120 z-1050 rounded-2xl overflow-hidden bg-[rgba(30,26,39,1)]"
        style={{
          border: '1px solid rgba(255, 255, 255, 10%)',
          backgroundColor: 'rgba(27,18,39,1)',
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {t('auth.changePassword')}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="password"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field>
                    <InputPassword
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      className="rounded-full"
                      type="password"
                      onChange={(e) => field.handleChange(e.target.value.replace(/\s+/g, ''))}
                      aria-invalid={isInvalid}
                      placeholder={t('auth.password')}
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="confirmPassword"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field>
                    <InputPassword
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      className="rounded-full"
                      type="password"
                      onChange={(e) => field.handleChange(e.target.value.replace(/\s+/g, ''))}
                      aria-invalid={isInvalid}
                      placeholder={t('auth.rePassword')}
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            <Field orientation="horizontal">
              <div className="flex w-full justify-center gap-4">
                <Button
                  variant="outline"
                  type="reset"
                  className="w-30 cursor-pointer"
                  shape="round"
                  onClick={() => setOpenChangePassword(false)}
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
