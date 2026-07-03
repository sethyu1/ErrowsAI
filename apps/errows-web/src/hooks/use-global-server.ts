import { useGlobalStore } from '@/stores/global';
import { useShallow } from 'zustand/react/shallow';

export function useGlobalServer() {
  const {
    isMobile,
    setOpenAuth,
    setOpenChoosePlan,
    setOpenLocale,
    setOpenGetCoins,
    setOpenPlay,
    setOpenLogout,
    setOpenChangePassword,
    setOpenPaymentStatus,
    paymentId,
    setPaymentId,
  } = useGlobalStore(useShallow(state => ({
    isMobile: state.isMobile,
    setOpenAuth: state.setOpenAuth,
    setOpenLocale: state.setOpenLocale,
    setOpenGetCoins: state.setOpenGetCoins,
    setOpenChoosePlan: state.setOpenChoosePlan,
    setOpenPlay: state.setOpenPlay,
    setOpenLogout: state.setOpenLogout,
    setOpenChangePassword: state.setOpenChangePassword,
    setOpenPaymentStatus: state.setOpenPaymentStatus,
    paymentId: state.paymentId,
    setPaymentId: state.setPaymentId,
  })));

  return {
    isMobile,
    setOpenChoosePlan,
    setOpenAuth,
    setOpenGetCoins,
    setOpenLocale,
    setOpenPlay,
    setOpenLogout,
    setOpenChangePassword,
    setOpenPaymentStatus,
    paymentId,
    setPaymentId,
  }
}
