import { request } from '@/apis/request';

/**
 * 获取 CD-Key 列表（分页、筛选）
 */
export function fetchCdkeysApi(params?: API.Payment.CDKeyListParams) {
  return request.get<API.Payment.CDKeyListResult>('/ops/payment/cdkeys', { params });
}

/**
 * 批量生成 CD-Key
 */
export function createCdkeysApi(data: API.Payment.CDKeyCreateParams) {
  return request.post<API.Payment.CDKeyCreateResult>('/ops/payment/cdkeys', data);
}

/**
 * 删除未兑换的 CD-Key
 */
export function deleteCdkeyApi(id: string) {
  return request.delete(`/ops/payment/cdkeys/${id}`);
}

/**
 * 更新未兑换的 CD-Key（有效期与权益）
 */
export function updateCdkeyApi(id: string, data: API.Payment.CDKeyUpdateParams) {
  return request.put(`/ops/payment/cdkeys/${id}`, data);
}
