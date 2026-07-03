import { create } from 'zustand';
import { getDefaultLocale } from '@/utils';
import i18n from '@/lib/i18n';

type AuthType = 'login' | 'signup'

interface GlobalStore {
  /** 注册、登录 */
  openAuth: boolean;
  /** 当前为Tab 登录/注册  */
  authType: AuthType;
  /** 当前语言 */
  locale: string;
  /** 语言选择 */
  openLocale: boolean;
  /** 是否为移动端 (宽度 < 640px) */
  isMobile: boolean;
  /** 金币购买弹窗 */
  openGetCoins: boolean;
  /** 订阅提示弹窗 (扣币不足等通用场景) */
  openSubscribeModal: boolean;
  subscribeModalOptions: {
    characterImageUrl?: string | null;
    onDismiss?: () => void;
    variant?: "default" | "rpmaster" | "voicecall" | "image";
  } | null;
  /** 选择订阅计划弹窗 */
  openChoosePlan: boolean;
  /** 支付弹框 */
  openPlay: boolean;
  /** 支付状态弹窗 */
  openPaymentStatus: boolean;
  /** 退出登录二次确认 */
  openLogout: boolean;
  /** 修改密码弹窗 */
  openChangePassword: boolean;
  /** 是否从首页进入角色详情页 */
  fromHomePage: boolean;
  /** 支付 ID */
  paymentId: string;

  setLocale: (locale: string) => void;
  setOpenAuth: (show: boolean, type?: AuthType) => void;
  setAuthType: (type: AuthType) => void;
  setOpenLocale: (show: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  setOpenGetCoins: (show: boolean) => void;
  setOpenSubscribeModal: (
    show: boolean,
    options?: {
      characterImageUrl?: string | null;
      onDismiss?: () => void;
      variant?: "default" | "rpmaster" | "voicecall" | "image";
    }
  ) => void;
  setOpenChoosePlan: (show: boolean) => void;
  setOpenPlay: (show: boolean) => void;
  setOpenPaymentStatus: (show: boolean) => void;
  setOpenLogout: (show: boolean) => void;
  setOpenChangePassword: (show: boolean) => void;
  setFromHomePage: (fromHomePage: boolean) => void;
  setPaymentId: (paymentId: string) => void;
}

export const useGlobalStore = create<GlobalStore>()(
  set => ({
    openAuth: false,
    authType: 'login',
    /** 当前语言 */
    locale: getDefaultLocale(),
    openLocale: false,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 640 : false,
    openGetCoins: false,
    openSubscribeModal: false,
    subscribeModalOptions: null,
    openChoosePlan: false,
    openPlay: false,
    openPaymentStatus: false,
    openLogout: false,
    openChangePassword: false,
    fromHomePage: false,
    paymentId: '',

    setOpenAuth: (show = true, type = 'login' as AuthType) => {
      set(state => ({
        openAuth: show,
        authType: show ? type : state.authType,
      }))
    },
    setAuthType: (type) => {
      set({
        authType: type,
      })
    },
    setLocale: (locale) => {
      i18n.changeLanguage(locale);
      set({
        locale,
      })
    },
    setOpenLocale: (show) => {
      set({
        openLocale: show,
      })
    },
    setIsMobile: (isMobile) => {
      set({
        isMobile,
      })
    },
    setOpenGetCoins: (show) => {
      set({
        openGetCoins: show,
      })
    },
    setOpenSubscribeModal: (show, options) => {
      set({
        openSubscribeModal: show,
        subscribeModalOptions: show && options ? options : null,
      })
    },
    setOpenChoosePlan: (show) => {
      set({
        openChoosePlan: show,
      })
    },
    setOpenPlay: (show) => {
      set({
        openPlay: show,
      })
    },
    setOpenPaymentStatus: (show) => {
      set({
        openPaymentStatus: show,
      })
    },
    setOpenLogout: (show) => {
      set({
        openLogout: show,
      })
    },
    setOpenChangePassword: (show) => {
      set({
        openChangePassword: show,
      })
    },
    setFromHomePage: (fromHomePage = false) => {
      set({
        fromHomePage,
      })
    },
    setPaymentId: (paymentId) => {
      set({
        paymentId,
      })
    },
  }),
);
