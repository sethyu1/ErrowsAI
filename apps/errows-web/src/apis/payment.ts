import { request } from '@/apis/request';

/** CD-key 兑换 */
export function redeemApi(data: API.Payment.RedeemData) {
  return request.post<API.Payment.RedeemResult>('/payment/cdkey/redeem', data);
}

/** 获取金币产品列表 */
export function fetchCoinProductsApi() {
  return request.get<API.Payment.CoinProductInfo[]>('/payment/coins');
}

/** 获取订阅计划列表 */
export function fetchPlansApi() {
  return request.get<API.Payment.PalnInfo[]>('/payment/subscriptions');
}

/** 购买金币 */
export function paymentCoinApi(id: string) {
  return request.post<API.Payment.PaymentCoinResult>(`/payment/coins/${id}/checkout`);
}

/** 购买订阅计划 */
export function paymentPlanApi(id: string) {
  return request.post<API.Payment.PaymentPlanResult>(`/payment/subscriptions/${id}/checkout`);
}

/** 查询支付状态 */
export function paymentStatusApi(id: string) {
  return request.get<API.Payment.PaymentStatusResult>(`/payment/${id}/status`);
}

/** 创建订阅管理门户会话 */
export function createSubscriptionPortalApi() {
  return request.post<{ url: string }>('/payment/subscriptions/portal');
}
