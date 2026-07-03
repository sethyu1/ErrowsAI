import { request } from '@/apis/request';

/**
 * 获取订阅套餐列表
 * GET /payments/subscriptions
 * @returns 订阅产品列表
 */
export function getSubscriptionProductsListApi() {
  return request.get<API.Payment.SUBSCRIPTION_PRODUCT[]>('/payment/subscriptions');
}

/**
 * 更新订阅套餐产品信息
 * PUT /payments/subscriptions/:type
 * @param type 套餐类型：'monthly' | 'yearly'
 * @param products 产品列表
 * @returns HTTP 204 响应
 */
export function updateSubscriptionProductsApi(data: {
  type: 'monthly' | 'yearly';
  products: API.Payment.SUBSCRIPTION_PRODUCT[];
}) {
  return request.put<void>(`/ops/payment/subscriptions/${data.type}`, {
    products: data.products,
  });
}

