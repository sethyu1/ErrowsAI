import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addPrefix } from '@/utils';
import qs from 'qs';

type PixelData = API.Pixel.BindPixelData;

interface PixelStore {
  data: PixelData | null;
  setData: (data: PixelData | null) => void;
  /** 从 URL 解析并保存 Pixel 数据 */
  saveFromQuery: () => void;
  /** 清除 Pixel 数据 */
  clear: () => void;
}

export const usePixelStore = create<PixelStore>()(
  persist(
    (set) => ({
      data: null,

      setData: (data) => {
        set({ data });
      },

      saveFromQuery: () => {
        const search = location.search;
        if (!search) return;

        const params = qs.parse(search, { ignoreQueryPrefix: true });
        const hasMeta = params.pixel;
        const hasReddit = params.rpixel;
        const hasClickId = params.clickid;
        const hasSiteId = params.siteid;

        if (hasMeta || hasReddit || hasClickId || hasSiteId) {
          const pixelData: PixelData = {
            ...(hasMeta && { pixel_id: params.pixel as string }),
            ...(params.s !== undefined && { s: params.s as string }),
            ...(params.c !== undefined && { c: params.c as string }),
            ...(params.g !== undefined && { g: params.g as string }),
            ...(params.ad !== undefined && { ad: params.ad as string }),
            ...(params.acc !== undefined && { acc: params.acc as string }),
            ...(params.fbclid && { fbclid: params.fbclid as string }),
            ...(hasReddit && { r_pixel_id: params.rpixel as string }),
            ...(params.rdt_cid && { rdt_cid: params.rdt_cid as string }),
            ...(hasClickId && { clickid: params.clickid as string }),
            ...(hasSiteId && { siteid: params.siteid as string }),
          } as PixelData;

          const cleanData = Object.fromEntries(
            Object.entries(pixelData).filter(([, v]) => v !== undefined && v !== '')
          ) as PixelData;

          set({ data: cleanData });

          const url = new URL(location.href);
          url.search = '';
          window.history.replaceState({}, '', url.toString());
        }
      },

      clear: () => {
        set({ data: null });
      },
    }),
    { name: addPrefix('pixel_data') },
  ),
);
