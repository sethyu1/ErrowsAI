import React from 'react';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Input } from '@errows/design/components/input';
import { Button } from '@errows/design/components/button';
import { Spinner } from '@errows/design/components/spinner';
import {
  Field,
  FieldError,
} from '@errows/design/components/field';
import { useLogin, useMobileLogin } from '@/services/auth';
import { ArrowRightIcon } from '@errows/icons';
import { useGlobalStore } from '@/stores/global';
import { useShallow } from 'zustand/react/shallow';
import { InputPassword } from '@/components';
import { CountryCodePicker, useCountryCode, formatMobileNumber } from '@/components/country-code-picker';
import { emailRegExp } from '@/config';
import { SegmentTabs } from './tabs';
import * as z from 'zod';

type LoginMethod = 'email' | 'mobile';

const mobileRegExp = /^[1-9]\d{4,14}$/;

export function LoginSection() {
  const { login, loading } = useLogin();
  const { mobileLogin, loading: mobileLoading } = useMobileLogin();
  const { t } = useTranslation();
  const [loginMethod, setLoginMethod] = React.useState<LoginMethod>('email');
  const { selectedCountry, setSelectedCountry } = useCountryCode();

  const { setOpenAuth } = useGlobalStore(useShallow(state => ({
    setOpenAuth: state.setOpenAuth,
  })));
  const navigate = useNavigate();

  const emailFormSchema = z.object({
    email: z
      .string()
      .min(1, t('auth.verifyEmailRequired'))
      .regex(emailRegExp, t('auth.verifyEmailFormat')),
    password: z
      .string()
      .min(1, t('auth.verifyPasswordRequired'))
      .min(6, t('auth.verifyPasswordMinLength')),
  });

  const mobileFormSchema = z.object({
    mobile: z
      .string()
      .min(1, t('auth.verifyMobileRequired'))
      .regex(mobileRegExp, t('auth.verifyMobileFormat')),
    password: z
      .string()
      .min(1, t('auth.verifyPasswordRequired'))
      .min(6, t('auth.verifyPasswordMinLength')),
  });

  const emailForm = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: emailFormSchema,
    },
    onSubmit: async ({ value }) => {
      await login(value);
    }
  });

  const mobileForm = useForm({
    defaultValues: {
      mobile: '',
      password: '',
    },
    validators: {
      onSubmit: mobileFormSchema,
    },
    onSubmit: async ({ value }) => {
      const fullMobile = formatMobileNumber(selectedCountry.dialCode, value.mobile);
      await mobileLogin({ ...value, mobile: fullMobile });
    }
  });

  const handleForgotPassword = () => {
    navigate('/forgot-password');
    setOpenAuth(false);
  }

  const isLoading = loginMethod === 'email' ? loading : mobileLoading;

  return (
    <div>
      <div className="mb-4">
        <SegmentTabs
          items={[
            { key: 'email', label: t('auth.email') },
            { key: 'mobile', label: t('auth.mobile') },
          ]}
          activeKey={loginMethod}
          onChange={(key) => setLoginMethod(key as LoginMethod)}
          lineColor="rgba(44,44,56,1)"
          indicatorColor="#ffffff"
          indicatorHeight={2}
        />
      </div>

      {loginMethod === 'email' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            emailForm.handleSubmit();
          }}
        >
          <div className="space-y-2">
            <emailForm.Field
              name="email"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      type="text"
                      className="rounded-full dark:bg-[rgba(9,10,10,1)]"
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder={t('auth.email')}
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            <emailForm.Field
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
          </div>

          <div className="mt-3 mb-5 flex justify-center pl-3 pr-5">
            <a onClick={handleForgotPassword} className="text-xs cursor-pointer">
              {t(`auth.forgotPassword`)}?
            </a>
          </div>

          <div className="flex justify-center">
            <Button className="w-60 flex" appearance="gradientFill" disabled={isLoading}>
              {isLoading && <Spinner />}
              <span>{t('auth.signIn')}</span>
              <ArrowRightIcon className="size-3" />
            </Button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mobileForm.handleSubmit();
          }}
        >
          <div className="space-y-2">
            <mobileForm.Field
              name="mobile"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field>
                    <div className="flex">
                      <CountryCodePicker
                        value={selectedCountry}
                        onChange={setSelectedCountry}
                      />
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        type="text"
                        className="rounded-r-full rounded-l-none dark:bg-[rgba(9,10,10,1)] flex-1"
                        onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, ''))}
                        aria-invalid={isInvalid}
                        placeholder={t('auth.mobileNumber')}
                        autoComplete="off"
                      />
                    </div>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />

            <mobileForm.Field
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
          </div>

          <div className="mt-3 mb-5 flex justify-center pl-3 pr-5">
            <a onClick={handleForgotPassword} className="text-xs cursor-pointer">
              {t(`auth.forgotPassword`)}?
            </a>
          </div>

          <div className="flex justify-center">
            <Button className="w-60 flex" appearance="gradientFill" disabled={isLoading}>
              {isLoading && <Spinner />}
              <span>{t('auth.signIn')}</span>
              <ArrowRightIcon className="size-3" />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
