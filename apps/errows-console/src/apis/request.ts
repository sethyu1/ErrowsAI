import type { RequestClientOptions } from '@yunzhen/request';
import { defaultResponseInterceptor, RequestClient } from '@yunzhen/request';
import qs from 'qs';
import { useAuthStore } from '@/stores/auth';
import { formatToken } from '@/utils';
import { TOKEN_KEY } from '@/constants';

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

  // 处理401错误，跳转到登录页
  client.addResponseInterceptor({
    rejected: (error) => {
      const status = error.response?.status;    
      if (status === 401 && window.location.pathname !== '/login') {
        // 清除认证信息
        const { setToken, setUser } = useAuthStore.getState();
        setToken('');
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('errows.console.user.name');
        
        // 跳转到登录页
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    },
  });

  return client;
}

const API_BASE_URL = '/api';                           // Web 开发时使用 proxy

export const request = createRequestClient(API_BASE_URL, {
  responseReturn: 'data',
  timeout: 30 * 1000,
  paramsSerializer
});

export const rawRequest = createRequestClient(API_BASE_URL, {
  responseReturn: 'raw',
  timeout: 30 * 1000,
  paramsSerializer
});
