import { request } from '@/apis/request';

/** 获取会员统计信息 */
export function fetchMemberStatsApi() {
  return request.get<API.Member.Stats>('/members/stats');
}

/** 获取会员信息 */
export function fetchMemberInfoApi() {
  return request.get<API.Member.InfoResult>('/members/info');
}
