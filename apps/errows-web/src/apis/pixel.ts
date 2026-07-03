import { request } from './request';

/**
 * 绑定 pixel
 */
export function bindPixelApi(data: API.Pixel.BindPixelData) {
  return request.put('/user/pixel', data);
};
