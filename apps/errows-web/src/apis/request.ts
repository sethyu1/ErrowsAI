import type { RequestClientOptions } from '@yunzhen/request';
import { defaultResponseInterceptor, RequestClient } from '@yunzhen/request';
import qs from 'qs';
import { useAuthStore } from '@/stores/auth';
import { useGlobalStore } from '@/stores/global';
import { formatToken } from '@/utils';
import { toast } from 'sonner';

function paramsSerializer(params: Record<string, unknown>) {
  for (const key in params) {
    if(params[key] === ''){
      params[key] = null;
    }
  }
  return qs.stringify(params, { arrayFormat: 'indices', skipNulls: true });
}

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: (config) => {
      const token = useAuthStore.getState().token;

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      token && (config.headers[`Authorization`] = formatToken(token));
      return config;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // 错误消息提示&401
  client.addResponseInterceptor({
    rejected: (error) => {
      const setToken = useAuthStore.getState().setToken;
      const setUser = useAuthStore.getState().setUser;
      const status = error.response?.status;
      const setOpenAuth = useGlobalStore.getState().setOpenAuth;
      const setOpenSubscribeModal = useGlobalStore.getState().setOpenSubscribeModal;

      if (status === 401) {
        setToken('');
        setUser(null);
        setOpenAuth(true, 'login');
        return Promise.reject(error);
      }

      if (status === 402) {
        setOpenSubscribeModal(true);
      }

      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.message;

      if (errorMessage) {
        toast.error(errorMessage, {
            position: 'top-center',
            closeButton: false,
            className: 'flex items-center justify-center',
        })
      }

      return Promise.reject(error);
    },
  });

  return client;
}

// 判断是否在 Capacitor App 中运行
const isCapacitor = typeof window !== 'undefined' &&
  (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

// App 中使用完整地址，Web 开发时使用 proxy
const API_BASE_URL = isCapacitor
  ? 'https://api.example.com/api'  // App 中使用线上地址
  : '/api';                           // Web 开发时使用 proxy

// 调试日志
console.log('[API] isCapacitor:', isCapacitor);
console.log('[API] API_BASE_URL:', API_BASE_URL);

export const request = createRequestClient(API_BASE_URL, {
  responseReturn: 'data',
  timeout: 600 * 1000,
  paramsSerializer
});

export const rawRequest = createRequestClient(API_BASE_URL, {
  responseReturn: 'raw',
  timeout: 600 * 1000,
  paramsSerializer
});
