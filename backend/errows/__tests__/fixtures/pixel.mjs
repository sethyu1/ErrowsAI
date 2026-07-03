import {
  deleteJSON,
  getJSON, putJSON,
} from '../lib/api.mjs';
import { test as baseTest } from './ops.mjs';

export const test = baseTest.extend({
  pixel_config: async ({ server, sysadmin_token }, use) => {
    // 创建一个测试用的 pixel 配置
    const pixel = {
      id: `test-pixel-${Date.now()}`,
      access_token: `test-token-${Date.now()}`,
      remark: 'Test pixel config for test case'
    };
    await updatePixelConfig(
      server, sysadmin_token,
      pixel.id, pixel.access_token, pixel.remark
    );

    await use(pixel);

    await deletePixelConfig(server, sysadmin_token, pixel.id);
  },
  banding_pixel: async ({ server, token, pixel_config }, use) => {
    // 绑定 pixel 配置到用户
    await bindPixel(
      server, token,
      { pixel_id: pixel_config.id }
    );

    await use(pixel_config);
  }
});

export async function updatePixelConfig(server, token, pixel_id, access_token, remark) {
  return putJSON(
    server, '/ops/pixel',
    { token, body: { pixel_id, access_token, remark } }
  );
}

export async function listPixelConfigs(server, token, query = {}) {
  const list_query = Object.assign({ page: 0, size: 20 }, query);
  return getJSON(
    server, '/ops/pixel',
    { token, query: list_query }
  );
}

export async function bindPixel(server, token, pixel, headers = {}) {
  return putJSON(
    server,
    '/user/pixel',
    { token, body: pixel, headers }
  );
}

export async function deletePixelConfig(server, token, pixel_id) {
  return deleteJSON(server, `/ops/pixel/${pixel_id}`, { token });
}