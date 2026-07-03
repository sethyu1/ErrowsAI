import React from 'react';
import { AuthDialog, AuthDrawer } from '../auth';
import { SelectLocale } from '../select-locale';
import { useGlobalStore } from '@/stores/global';
import { useAuthStore } from '@/stores/auth';
import { useMemberStore } from '@/stores/member';
import { useShallow } from 'zustand/react/shallow';
import { useMobileDetector } from '@/hooks/use-mobile-detector';
import {
  Tips,
  PaymentStatus,
  Logout,
  ChangePassword,
} from './components';
import { ChoosePlan } from '../choose-plan';
import { CoinsDialog, CoinsDrawer } from '../coins';
import { VoiceCallSubscribeModal } from '@/pages/chat/components/voice-call-subscribe-modal';
import { ChristmasSaleModal } from '@/pages/home/components/christmas-sale-modal';
import { STORAGE_KEYS } from '@/config';

let _pendingSaleOnLogin = (() => {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.CHRISTMAS_SALE_NEW_USER);
    if (val === '1') {
      localStorage.removeItem(STORAGE_KEYS.CHRISTMAS_SALE_NEW_USER);
      const today = new Date().toISOString().slice(0, 10);
      const lastShown = localStorage.getItem(STORAGE_KEYS.CHRISTMAS_SALE_LAST_SHOWN);
      if (lastShown === today) return false;
      return true;
    }
  } catch { /* noop */ }
  return false;
})();

export function GlobalSever() {
  const [showTips, setShowTips] = React.useState(false);
  const [saleModalOpen, setSaleModalOpen] = React.useState(false);
  const memberInfo = useMemberStore(state => state.info);

  const {
    isMobile,
    openLogout,
    openAuth,
    openChoosePlan,
    openLocale,
    openGetCoins,
    openSubscribeModal,
    subscribeModalOptions,
    openChangePassword,
    openPaymentStatus,
    setOpenAuth,
    setOpenChoosePlan,
    setOpenLocale,
    setOpenGetCoins,
    setOpenSubscribeModal,
    setOpenLogout,
    setOpenChangePassword,
    setOpenPaymentStatus,
  } = useGlobalStore(useShallow(state => ({
    isMobile: state.isMobile,
    openLogout: state.openLogout,
    openChoosePlan: state.openChoosePlan,
    openAuth: state.openAuth,
    openLocale: state.openLocale,
    openGetCoins: state.openGetCoins,
    openSubscribeModal: state.openSubscribeModal,
    subscribeModalOptions: state.subscribeModalOptions,
    openChangePassword: state.openChangePassword,
    openPaymentStatus: state.openPaymentStatus,
    setOpenAuth: state.setOpenAuth,
    setOpenGetCoins: state.setOpenGetCoins,
    setOpenSubscribeModal: state.setOpenSubscribeModal,
    setOpenChoosePlan: state.setOpenChoosePlan,
    setOpenLocale: state.setOpenLocale,
    setOpenLogout: state.setOpenLogout,
    setOpenChangePassword: state.setOpenChangePassword,
    setOpenPaymentStatus: state.setOpenPaymentStatus,
  })));
  const { token } = useAuthStore(useShallow(state => ({
    token: state.token,
  })))
  useMobileDetector();

  React.useEffect(() => {
    const tips = localStorage.getItem(STORAGE_KEYS.TIPS);

    if (!tips) {
      setShowTips(true);
    }
  }, []);

  React.useEffect(() => {
    if (!_pendingSaleOnLogin || !token) return;
    _pendingSaleOnLogin = false;
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.CHRISTMAS_SALE_LAST_SHOWN, today);
    setSaleModalOpen(true);
  }, [token]);

  React.useEffect(() => {
    if (!token) return;
    const plan = memberInfo?.plan;
    if (plan && plan !== 'free') {
      setSaleModalOpen(false);
      return;
    }
  }, [token, memberInfo?.plan]);

  const handleCloseTips = () => {
    setShowTips(false);
  }

  const handleTipsConfirm = () => {
    localStorage.setItem(STORAGE_KEYS.TIPS, 'init')
    setShowTips(false);
  }

  const handleTipsExit = () => {}

  return (
    <>
      {/* 注册、登录 */}
      {
        isMobile
          ? <AuthDrawer open={openAuth} onOpenChange={setOpenAuth} />
          : <AuthDialog open={openAuth} onOpenChange={setOpenAuth} />
      }

      {/* 语言选择 */}
      <SelectLocale open={openLocale} onOpenChange={setOpenLocale} />

      {/* 金币购买弹窗 */}
      {token && (
        <>
          {
            isMobile
              ? <CoinsDrawer open={openGetCoins} onOpenChange={setOpenGetCoins} />
              : <CoinsDialog open={openGetCoins} onOpenChange={setOpenGetCoins} />
          }
        </>
      )}

      {token && (
        <VoiceCallSubscribeModal
          open={openSubscribeModal}
          onOpenChange={(next) => setOpenSubscribeModal(next)}
          onDismiss={subscribeModalOptions?.onDismiss}
          characterImageUrl={subscribeModalOptions?.characterImageUrl}
          variant={subscribeModalOptions?.variant}
        />
      )}

      {/* 18 岁提示 */}
      <Tips
        open={showTips}
        onExit={handleTipsExit}
        onConfirm={handleTipsConfirm}
        onOpenChange={handleCloseTips}
      />

      {/* 会员订阅计划 */}
      {token && (
        <ChoosePlan open={openChoosePlan} onOpenChange={setOpenChoosePlan} />
      )}

      {/* 退出登录二次确认 */}
      <Logout open={openLogout} onOpenChange={setOpenLogout} />

      {/* 支付状态 */}
      <PaymentStatus open={openPaymentStatus} onOpenChange={setOpenPaymentStatus} />

      {/* 修改密码 */}
      <ChangePassword open={openChangePassword} onOpenChange={setOpenChangePassword} />

      {token && (
        <ChristmasSaleModal open={saleModalOpen} onOpenChange={setSaleModalOpen} />
      )}
    </>
  )
}
