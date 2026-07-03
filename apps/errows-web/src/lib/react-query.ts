import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 失败后重试次数
      retry: false,
      // 数据1分钟内视为“新鲜”，不重复请求
      staleTime: 1000 * 60,
      // 窗口聚焦时不自动重拉数据
      refetchOnWindowFocus: false,
      // 网络重连时不自动重拉数据
      refetchOnReconnect: false,
      // 组件挂载时不自动重拉数据
      refetchOnMount: false,
    },
    mutations: {
      retry: false,
    },
  },
});
