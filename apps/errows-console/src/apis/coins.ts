import { request } from '@/apis/request';

/**
 * 获取金币产品列表
 * @returns
 */
export function fetchCoinProductsApi() {
  return request.get<API.Coin.Product[]>('/payment/coins');
}

/**
 * 更新金币产品列表
 * @returns
 */
export function updateCoinProductsApi(data: API.Coin.UpdateCoinProductsData) {
  return request.put('/ops/payment/coins', data);
}
