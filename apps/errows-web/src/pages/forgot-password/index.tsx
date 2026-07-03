import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@errows/design/components/button';
import { Spinner } from '@errows/design/components/spinner';
import { ArrowRightIcon } from '@errows/icons';
import { useCountDown } from 'ahooks';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
  FieldError,
} from '@errows/design/components/field';
import { useForm } from '@tanstack/react-form';
import { Input } from '@errows/design/components/input';
import { toast } from 'sonner';
import { useGlobalServer } from '@/hooks/use-global-server';
import { useForgotPassword, useMobileForgotPassword, useSendVerificationCode, useSendMobileVerificationCode } from '@/services/auth';
import { InputPassword } from '@/components';
import { CountryCodePicker, useCountryCode, formatMobileNumber } from '@/components/country-code-picker';
import { SegmentTabs } from '@/components/auth/components/auth/tabs';
import { emailRegExp } from '@/config';
import * as z from 'zod';

type ResetMethod = 'email' | 'mobile';
const mobileRegExp = /^[1-9]\d{4,14}$/;

function ForgotPassword() {
  const { setOpenAuth } = useGlobalServer();
  const { t } = useTranslation();
  const { forgotPassword, loading } = useForgotPassword();
  const { mobileForgotPassword, loading: mobileLoading } = useMobileForgotPassword();
  const { sendVerificationCode, loading: sendCodeLoading } = useSendVerificationCode();
  const { sendMobileVerificationCode, loading: sendMobileCodeLoading } = useSendMobileVerificationCode();
  const [resetMethod, setResetMethod] = React.useState<ResetMethod>('email');
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
    verificationCode: z
      .string()
      .min(1, t('auth.verifyCodeRequired'))
      .regex(/^\d{6}$/, t('auth.verifyCodeFormat')),
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
    verificationCode: z
      .string()
      .min(1, t('auth.verifyCodeRequired'))
      .regex(/^\d{6}$/, t('auth.verifyCodeFormat')),
    password: z
      .string()
      .min(1, t('auth.verifyPasswordRequired'))
      .min(6, t('auth.verifyPasswordMinLength')),
  });

  const emailForm = useForm({
    defaultValues: {
      email: '',
      verificationCode: '',
      password: '',
    },
    validators: {
      onSubmit: emailFormSchema,
    },
    onSubmit: async ({ value }) => {
      await forgotPassword(value);
      emailForm.reset();
    }
  });

  const mobileForm = useForm({
    defaultValues: {
      mobile: '',
      verificationCode: '',
      password: '',
    },
    validators: {
      onSubmit: mobileFormSchema,
    },
    onSubmit: async ({ value }) => {
      const fullMobile = formatMobileNumber(selectedCountry.dialCode, value.mobile);
      await mobileForgotPassword({ ...value, mobile: fullMobile });
      mobileForm.reset();
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
      await sendVerificationCode({ email, type: 2 });
      setCodeTargetDate(Date.now() + 60 * 1000);
      toast.success(t('auth.verificationCodeSent'));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '';
      const isEmailNotRegistered = 
        errorMessage.toLowerCase().includes('not found') ||
        errorMessage.toLowerCase().includes('email not found') ||
        errorMessage.toLowerCase().includes('email not registered');

      if (isEmailNotRegistered) {
        setEmailError(t('auth.emailNotRegistered'));
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
      await sendMobileVerificationCode({ mobile: fullMobile, type: 2 });
      setCodeTargetDate(Date.now() + 60 * 1000);
      toast.success(t('auth.verificationCodeSent'));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || '';
      const isMobileNotRegistered = 
        errorMessage.toLowerCase().includes('not found') ||
        errorMessage.toLowerCase().includes('mobile not found') ||
        errorMessage.toLowerCase().includes('mobile not registered');

      if (isMobileNotRegistered) {
        setMobileError(t('auth.mobileNotRegistered'));
      } else {
        toast.error(t('auth.sendCodeFailed'));
      }
    }
  };

  const handleMethodChange = (method: string) => {
    setResetMethod(method as ResetMethod);
    setCodeTargetDate(null);
    setEmailError(null);
    setMobileError(null);
  };

  const handleReturnAuth = () => {
    setOpenAuth(true, 'login');
  }

  const isLoading = resetMethod === 'email' ? loading : mobileLoading;
  const isSendCodeLoading = resetMethod === 'email' ? sendCodeLoading : sendMobileCodeLoading;

  return (
    <div className="m-auto text-amber-50 flex justify-center">
      <div className="w-85">
        <FieldGroup>
          <FieldSet>
            <FieldLegend className="mb-2 text-center text-2xl font-bold">
              {t('auth.forgotPassword')}?
            </FieldLegend>
            <div className="flex justify-center">
              <FieldDescription className="w-70 text-center text-xs">
                {t('auth.forgotPasswordDesc')}
              </FieldDescription>
            </div>
          </FieldSet>

          <div className="mb-4">
            <SegmentTabs
              items={[
                { key: 'email', label: t('auth.email') },
                { key: 'mobile', label: t('auth.mobile') },
              ]}
              activeKey={resetMethod}
              onChange={handleMethodChange}
              lineColor="rgba(44,44,56,1)"
              indicatorColor="#ffffff"
              indicatorHeight={2}
            />
          </div>

          {resetMethod === 'email' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                emailForm.handleSubmit();
              }}
            >
              <FieldGroup>
                <emailForm.Field
                  name="email"
                  children={(field) => {
                    const isInvalid = (field.state.meta.isTouched && !field.state.meta.isValid) || emailError !== null;
                    const rawErrors = emailError ? [emailError] : field.state.meta.errors;
                    const errors = rawErrors?.map((error) =>
                      typeof error === 'string' ? { message: error } : error
                    );

                    return (
                      <Field data-invalid={isInvalid}>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            if (emailError) {
                              setEmailError(null);
                            }
                          }}
                          aria-invalid={isInvalid}
                          className="rounded-full"
                          placeholder={t('auth.email')}
                        />
                        {isInvalid && errors && errors.length > 0 && (
                          <FieldError errors={errors} />
                        )}
                      </Field>
                    );
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
                      <Field data-invalid={isInvalid}>
                        <div className="flex gap-2">
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            aria-invalid={isInvalid}
                            className="rounded-full flex-1"
                            placeholder={t('auth.verificationCode')}
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
                    );
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
                      <Field data-invalid={isInvalid}>
                        <InputPassword
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          className="rounded-full"
                          type="password"
                          onChange={(e) => field.handleChange(e.target.value.replace(/\s+/g, ''))}
                          aria-invalid={isInvalid}
                          placeholder={t('auth.newPassword')}
                          autoComplete="off"
                        />
                        {isInvalid && errors && errors.length > 0 && (
                          <FieldError errors={errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              </FieldGroup>

              <Field orientation="horizontal" className="mt-4">
                <Button
                  disabled={isLoading}
                  type="submit"
                  className="w-60 mx-auto cursor-pointer"
                  appearance="gradientFill"
                  shape="round"
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      <span>{t('auth.resetPassword') || 'Reset Password'}</span>
                      <ArrowRightIcon className="size-4" />
                    </>
                  )}
                </Button>
              </Field>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mobileForm.handleSubmit();
              }}
            >
              <FieldGroup>
                <mobileForm.Field
                  name="mobile"
                  children={(field) => {
                    const isInvalid = (field.state.meta.isTouched && !field.state.meta.isValid) || mobileError !== null;
                    const rawErrors = mobileError ? [mobileError] : field.state.meta.errors;
                    const errors = rawErrors?.map((error) =>
                      typeof error === 'string' ? { message: error } : error
                    );

                    return (
                      <Field data-invalid={isInvalid}>
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
                            onChange={(e) => {
                              field.handleChange(e.target.value.replace(/\D/g, ''));
                              if (mobileError) {
                                setMobileError(null);
                              }
                            }}
                            aria-invalid={isInvalid}
                            className="rounded-r-full rounded-l-none flex-1"
                            placeholder={t('auth.mobileNumber')}
                          />
                        </div>
                        {isInvalid && errors && errors.length > 0 && (
                          <FieldError errors={errors} />
                        )}
                      </Field>
                    );
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
                      <Field data-invalid={isInvalid}>
                        <div className="flex gap-2">
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            aria-invalid={isInvalid}
                            className="rounded-full flex-1"
                            placeholder={t('auth.verificationCode')}
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
                    );
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
                      <Field data-invalid={isInvalid}>
                        <InputPassword
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          className="rounded-full"
                          type="password"
                          onChange={(e) => field.handleChange(e.target.value.replace(/\s+/g, ''))}
                          aria-invalid={isInvalid}
                          placeholder={t('auth.newPassword')}
                          autoComplete="off"
                        />
                        {isInvalid && errors && errors.length > 0 && (
                          <FieldError errors={errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              </FieldGroup>

              <Field orientation="horizontal" className="mt-4">
                <Button
                  disabled={isLoading}
                  type="submit"
                  className="w-60 mx-auto cursor-pointer"
                  appearance="gradientFill"
                  shape="round"
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      <span>{t('auth.resetPassword') || 'Reset Password'}</span>
                      <ArrowRightIcon className="size-4" />
                    </>
                  )}
                </Button>
              </Field>
            </form>
          )}

          <div className="text-center mt-4 text-xs">
            <span
              className="cursor-pointer underline text-xs leading-4 tracking-wider text-[#A1A8A8]"
              onClick={handleReturnAuth}
            >
              {t('auth.returnToSignIn')}
            </span>
          </div>
        </FieldGroup>
      </div>
    </div>
  );
}

export default ForgotPassword;

