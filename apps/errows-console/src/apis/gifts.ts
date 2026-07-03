import { request } from '@/apis/request';

// 导出类型供其他模块使用
export type Gift = API.Gift.Gift;

/**
 * 获取礼物列表
 * @param params 分页参数
 * @returns
 */
export async function fetchGiftsApi(params: API.Gift.FetchGiftsParams) {
  const response = await request.get<API.Gift.FetchGiftsResponse>('/ops/gifts', { params });
  
  // 添加排序字段
  return {
    count: response.count,
    data: response.data.map((item, index) => ({
      ...item,
      sort: index + 1,
    })),
  };
}

/**
 * 添加礼物
 * @param data 礼物数据
 * @returns
 */
export function addGiftApi(data: Omit<API.Gift.Gift, 'id' | 'sort'>) {
  return request.post<API.Gift.AddGiftResponse>('/ops/gifts', data);
}

/**
 * 更新礼物
 * @param giftId 礼物 ID
 * @param data 礼物数据
 * @returns
 */
export function updateGiftApi(giftId: string, data: API.Gift.Gift) {
  return request.put(`/ops/gifts/${giftId}`, data);
}

/**
 * 删除礼物
 * @param giftId 礼物 ID
 * @returns
 */
export function deleteGiftApi(giftId: string) {
  return request.delete(`/ops/gifts/${giftId}`);
}

