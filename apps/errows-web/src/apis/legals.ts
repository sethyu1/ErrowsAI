import { request } from '@/apis/request';

/**
 * 获取法律条款列表
 * @returns
 */
export function fetchLegalTermsApi() {
  return request.get<API.Legal.LEGAL_TERM[]>('/legal');
}
