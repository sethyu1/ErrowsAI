import { request } from "@/apis/request";

export interface HomeDisplayBannerImage {
  url: string;
  title?: string;
  link?: string;
}

export interface HomeDisplayCarouselSlot {
  character_id: string;
  image_url?: string;
  title?: string;
  link?: string;
  order?: number;
}

export interface HomeDisplayConfig {
  banner: { images: HomeDisplayBannerImage[] };
  carousel: { slots: HomeDisplayCarouselSlot[] };
  top_character_ids: string[];
}

/**
 * 获取首页与轮盘配置（公开接口，无需登录）
 * GET /config/home-display
 */
export function fetchHomeDisplayConfigApi() {
  return request.get<HomeDisplayConfig>("/config/home-display");
}
