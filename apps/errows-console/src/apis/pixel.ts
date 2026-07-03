import { request } from '@/apis/request';

export type PixelScope = 'pixel' | 'r_pixel' | 'x_pixel';

function scopePath(scope: PixelScope): string {
  return `/ops/${scope}`;
}

export function fetchPixelListApi(
  scope: PixelScope,
  params: API.Pixel.FetchPixelListParams
) {
  return request.get<API.Pixel.FetchPixelListResult>(scopePath(scope), {
    params,
  });
}

export function createPixelApi(scope: PixelScope, data: API.Pixel.CreatePixeData) {
  return request.put(scopePath(scope), data);
}

export function updatePixelApi(scope: PixelScope, data: API.Pixel.CreatePixeData) {
  return request.put(scopePath(scope), data);
}

export function deletePixelApi(scope: PixelScope, pixelId: string) {
  return request.delete(`${scopePath(scope)}/${pixelId}`);
}
