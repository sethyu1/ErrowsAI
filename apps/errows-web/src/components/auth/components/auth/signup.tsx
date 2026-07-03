import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { useCountDown } from 'ahooks';
import { Input } from '@errows/design/components/input';
import { Button } from '@errows/design/components/button';
import { Spinner } from '@errows/design/components/spinner';
import {
  Field,
  FieldError,
} from '@errows/design/components/field'
import { toast } from 'sonner';
import { useRegister, useSendVerificationCode, useMobileRegister, useSendMobileVerificationCode } from '@/services/auth';
import { ArrowRightIcon } from '@errows/icons';
import { InputPassword } from '@/components';
import { CountryCodePicker, useCountryCode, formatMobileNumber } from '@/components/country-code-picker';
import { emailRegExp } from '@/config';
import { SegmentTabs } from './tabs';
import * as z from 'zod';

type SignupMethod = 'email' | 'mobile';

const mobileRegExp = /^[1-9]\d{4,14}$/;

export function SignupSection() {
  const { register, loading } = useRegister();
  const { mobileRegister, loading: mobileLoading } = useMobileRegister();
  const { sendVerificationCode, loading: sendCodeLoading } = useSendVerificationCode();
  const { sendMobileVerificationCode, loading: sendMobileCodeLoading } = useSendMobileVerificationCode();
  const { t } = useTranslation();
  const [signupMethod, setSignupMethod] = React.useState<SignupMethod>('mobile');
  const [codeTargetDate, setCodeTargetDate] = React.useState<number | null>(null);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [mobileError, setMobileError] = React.useState<string | null>(null);
  const { selectedCountry, setSelectedCountry } = useCountryCode();

  const [codeCountdown] = useCountDown({
    targetDate: codeTargetDate,
    onEnd: () => {
      setCodeTargetDate(null);
    },
  });

  const emailFormSchema = z.object({
    email: z
      .string()
      .min(1, t('auth.verifyEmailRequired'))
      .regex(emailRegExp, t('auth.verifyEmailFormat')),
    password: z
      .string()
      .min(1, t('auth.verifyPasswordRequired'))
      .min(6, t('auth.verifyPasswordMinLength')),
    verificationCode: z
      .string()
      .min(1, t('auth.verifyCodeRequired'))
      .regex(/^\d{6}$/, t('auth.verifyCodeFormat')),
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
    verificationCode: z
      .string()
      .min(1, t('auth.verifyCodeRequired'))
      .regex(/^\d{6}$/, t('auth.verifyCodeFormat')),
  });

  const emailForm = useForm({
    defaultValues: {
      email: '',
      password: '',
      verificationCode: '',
    },
    validators: {
      onSubmit: emailFormSchema,
    },
    onSubmit: async ({ value }) => {
      await register(value);
    }
  });

  const mobileForm = useForm({
    defaultValues: {
      mobile: '',
      password: '',
      verificationCode: '',
    },
    validators: {
      onSubmit: mobileFormSchema,
    },
    onSubmit: async ({ value }) => {
      const fullMobile = formatMobileNumber(selectedCountry.dialCode, value.mobile);
      await mobileRegister({ ...value, mobile: fullMobile });
    }
  });

  const handleSendEmailVerificationCode = async () => {
    const email = emailForm.getFieldValue('email');
    if (!email || !emailRegExp.test(email)) {
      toast.error(t('auth.verifyEmailFormat'));
      setEmailError(null);
      return;
    }

    setEmailError(null);

    try {
      await sendVerificationCode({ email, type: 1 });
      setCodeTargetDate(Date.now() + 60 * 1000);
      toast.success(t('auth.verificationCodeSent'));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '';
      const isEmailAlreadyRegistered = 
        errorMessage.toLowerCase().includes('already registered') ||
        errorMessage.toLowerCase().includes('email is already registered');
      
      if (isEmailAlreadyRegistered) {
        setEmailError(t('auth.emailAlreadyRegistered'));
      } else {
        toast.error(t('auth.sendCodeFailed'));
      }
    }
  };

  const handleSendMobileVerificationCode = async () => {
    const mobile = mobileForm.getFieldValue('mobile');
    if (!mobile || !mobileRegExp.test(mobile)) {
      toast.error(t('auth.verifyMobileFormat'));
      setMobileError(null);
      return;
    }

    setMobileError(null);
    const fullMobile = formatMobileNumber(selectedCountry.dialCode, mobile);

    try {
      await sendMobileVerificationCode({ mobile: fullMobile, type: 1 });
      setCodeTargetDate(Date.now() + 60 * 1000);
      toast.success(t('auth.verificationCodeSent'));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '';
      const isMobileAlreadyRegistered = 
        errorMessage.toLowerCase().includes('already registered') ||
        errorMessage.toLowerCase().includes('mobile is already registered');
      
      if (isMobileAlreadyRegistered) {
        setMobileError(t('auth.mobileAlreadyRegistered'));
      } else {
        toast.error(t('auth.sendCodeFailed'));
      }
    }
  };

  const handleMethodChange = (method: string) => {
    setSignupMethod(method as SignupMethod);
    setCodeTargetDate(null);
    setEmailError(null);
    setMobileError(null);
  };

  const isLoading = signupMethod === 'email' ? loading : mobileLoading;
  const isSendCodeLoading = signupMethod === 'email' ? sendCodeLoading : sendMobileCodeLoading;

  return (
    <div>
      <div className="mb-4">
        <SegmentTabs
          items={[
            { key: 'email', label: t('auth.email') },
            { key: 'mobile', label: t('auth.mobile') },
          ]}
          activeKey={signupMethod}
          onChange={handleMethodChange}
          lineColor="rgba(44,44,56,1)"
          indicatorColor="#ffffff"
          indicatorHeight={2}
        />
      </div>

      {signupMethod === 'email' ? (
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
                const isInvalid = (field.state.meta.isTouched && !field.state.meta.isValid) || emailError !== null;
                const rawErrors = emailError ? [emailError] : field.state.meta.errors;
                const errors = rawErrors?.map((error) => 
                  typeof error === 'string' ? { message: error } : error
                );

                return (
                  <Field>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      type="text"
                      className="rounded-full dark:bg-[rgba(9,10,10,1)]"
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        if (emailError) {
                          setEmailError(null);
                        }
                      }}
                      aria-invalid={isInvalid}
                      placeholder={t('auth.email')}
                      autoComplete="off"
                    />
                    {isInvalid && errors && errors.length > 0 && (
                      <FieldError errors={errors} />
                    )}
                  </Field>
                )
              }}
            />

            <emailForm.Field
              name="verificationCode"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const errors = field.state.meta.errors?.map((error) => 
                  typeof error === 'string' ? { message: error } : error
                );

                return (
                  <Field>
                    <div className="flex gap-2">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        type="text"
                        className="rounded-full dark:bg-[rgba(9,10,10,1)] flex-1"
                        onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        aria-invalid={isInvalid}
                        placeholder={t('auth.verificationCode')}
                        autoComplete="off"
                      />
                      <Button
                        type="button"
                        onClick={handleSendEmailVerificationCode}
                        disabled={isSendCodeLoading || codeCountdown !== 0}
                        className="px-4 py-2 rounded-full"
                      >
                        {codeCountdown !== 0
                          ? `${Math.round(codeCountdown / 1000)}S`
                          : isSendCodeLoading
                          ? <Spinner />
                          : t('auth.sendCode')
                        }
                      </Button>
                    </div>
                    {isInvalid && errors && errors.length > 0 && (
                      <FieldError errors={errors} />
                    )}
                  </Field>
                )
              }}
            />

            <emailForm.Field
              name="password"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const errors = field.state.meta.errors?.map((error) => 
                  typeof error === 'string' ? { message: error } : error
                );

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
                    {isInvalid && errors && errors.length > 0 && (
                      <FieldError errors={errors} />
                    )}
                  </Field>
                )
              }}
            />
          </div>

          <div className="mt-2 mb-2 flex justify-center pl-3 pr-5">
            <span className="text-xs text-transparent">
              Forgot Password?
            </span>
          </div>

          <div className="flex justify-center mb-1">
            <Button
              type="submit"
              appearance="gradientFill"
              disabled={isLoading}
              style={{ width: 240 }}
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <>
                  <span>{t(`auth.joinInFree`)}</span>
                  <ArrowRightIcon className="size-3" />
                </>
              )}
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
                const isInvalid = (field.state.meta.isTouched && !field.state.meta.isValid) || mobileError !== null;
                const rawErrors = mobileError ? [mobileError] : field.state.meta.errors;
                const errors = rawErrors?.map((error) => 
                  typeof error === 'string' ? { message: error } : error
                );

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
                        onChange={(e) => {
                          field.handleChange(e.target.value.replace(/\D/g, ''));
                          if (mobileError) {
                            setMobileError(null);
                          }
                        }}
                        aria-invalid={isInvalid}
                        placeholder={t('auth.mobileNumber')}
                        autoComplete="off"
                      />
                    </div>
                    {isInvalid && errors && errors.length > 0 && (
                      <FieldError errors={errors} />
                    )}
                  </Field>
                )
              }}
            />

            <mobileForm.Field
              name="verificationCode"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const errors = field.state.meta.errors?.map((error) => 
                  typeof error === 'string' ? { message: error } : error
                );

                return (
                  <Field>
                    <div className="flex gap-2">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        type="text"
                        className="rounded-full dark:bg-[rgba(9,10,10,1)] flex-1"
                        onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        aria-invalid={isInvalid}
                        placeholder={t('auth.verificationCode')}
                        autoComplete="off"
                      />
                      <Button
                        type="button"
                        onClick={handleSendMobileVerificationCode}
                        disabled={isSendCodeLoading || codeCountdown !== 0}
                        className="px-4 py-2 rounded-full"
                      >
                        {codeCountdown !== 0
                          ? `${Math.round(codeCountdown / 1000)}S`
                          : isSendCodeLoading
                          ? <Spinner />
                          : t('auth.sendCode')
                        }
                      </Button>
                    </div>
                    {isInvalid && errors && errors.length > 0 && (
                      <FieldError errors={errors} />
                    )}
                  </Field>
                )
              }}
            />

            <mobileForm.Field
              name="password"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                const errors = field.state.meta.errors?.map((error) => 
                  typeof error === 'string' ? { message: error } : error
                );

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
                    {isInvalid && errors && errors.length > 0 && (
                      <FieldError errors={errors} />
                    )}
                  </Field>
                )
              }}
            />
          </div>

          <div className="mt-2 mb-2 flex justify-center pl-3 pr-5">
            <span className="text-xs text-transparent">
              Forgot Password?
            </span>
          </div>

          <div className="flex justify-center mb-1">
            <Button
              type="submit"
              appearance="gradientFill"
              disabled={isLoading}
              style={{ width: 240 }}
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <>
                  <span>{t(`auth.joinInFree`)}</span>
                  <ArrowRightIcon className="size-3" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
