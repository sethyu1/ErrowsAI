import { request } from '@/apis/request';

export interface HomeDisplayBannerImage {
  url: string;
  title?: string;
  link?: string;
}

export interface HomeDisplayCarouselSlot {
  character_id: string;
  image_url?: string;
  /** Optional title overlay */
  title?: string;
  /** Optional link (e.g. for click-through) */
  link?: string;
  /** Display order (lower = earlier). Optional. */
  order?: number;
}

export interface HomeDisplayConfig {
  banner: { images: HomeDisplayBannerImage[] };
  carousel: { slots: HomeDisplayCarouselSlot[] };
  top_character_ids: string[];
}

/**
 * 获取首页与轮盘配置（公开或 ops）
 * GET /config/home-display 或 GET /ops/config/home-display
 */
export function getHomeDisplayConfigApi() {
  return request.get<HomeDisplayConfig>('/ops/config/home-display');
}

/**
 * 更新首页与轮盘配置
 * PUT /ops/config/home-display
 */
export function updateHomeDisplayConfigApi(data: Partial<HomeDisplayConfig>) {
  return request.put<HomeDisplayConfig>('/ops/config/home-display', data);
}
