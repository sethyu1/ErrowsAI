import { useTranslation } from 'react-i18next';
import { AuthTabs } from '@/components/auth/components/auth/tabs'
import { OAuthProviders } from '@/components/auth/components/auth/providers'
import { LoginSection } from '@/components/auth/components/auth/login'
import { SignupSection } from '@/components/auth/components/auth/signup'
import { AuroraText } from '@errows/design/components/aurora-text';
import { useGlobalStore } from '@/stores/global';
import { useShallow } from 'zustand/react/shallow';

export function LoginForm() {
  const { t } = useTranslation();
  const { authType, setAuthType } = useGlobalStore(useShallow(state => ({
    authType: state.authType,
    setAuthType: state.setAuthType,
  })));

  return (
    <div className="relative w-full text-white">
      <div className="text-center pt-13.5 pb-5.5 px-0">
        <h1 className="mb-2 text-[22px] font-bold tracking-tight">
          {t('auth.joinAndGetAGift')}
        </h1>
        <AuroraText className="text-[12px]">
          {t('auth.100FreeCoinsToGenerateImages')}
        </AuroraText>
      </div>

      <AuthTabs active={authType} onChange={setAuthType} />

      <div className="max-sm:px-3 px-10 py-8">
        <OAuthProviders />

        <div className="mb-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-600" />
          <span className="text-sm text-gray-400">{t('auth.orContinueWith')}</span>
          <div className="h-px flex-1 bg-gray-600" />
        </div>

        {authType === 'login' ? (
          <LoginSection />
        ) : (
          <SignupSection />
        )}

        <p className="text-center mt-3 text-xs text-gray-400">
          {t('auth.youAgreeToTermsAndConditions')}
        </p>
      </div>
    </div>
  )
}


