import { request } from '@/apis/request';

// 导出类型供其他模块使用
export type Support = API.Support.Support;

/**
 * 获取 Support 列表
 * @param params 分页参数
 * @returns
 */
export async function fetchSupportsApi(params: API.Support.FetchSupportsParams) {
  return request.get<API.Support.FetchSupportsResponse>('/ops/supports', { params });
}

