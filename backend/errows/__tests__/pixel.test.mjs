import { describe, expect, onTestFinished } from 'vitest';
import { vi } from 'vitest';
import { userProfile } from './fixtures/user.mjs';
import { mock_payment_service } from './fixtures/payment.mjs';
import {
  test,
  updatePixelConfig,
  listPixelConfigs,
  bindPixel,
} from './fixtures/pixel.mjs';
import { methods as pixelMethods } from '../services/libs/pixel.mjs';

const scope = 'errows_pixel_tests';
const mock_errows_service = {
  name: 'errows',
  actions: {
    character_list_my: vi.fn()
    .mockResolvedValue({ count: 0, characters: [] })
  }
};

const pixelTrackSpy = vi.spyOn(pixelMethods, 'pixelTrack');
pixelTrackSpy.mockResolvedValue({});

test.scoped({
  scope,
  services: [ 'user', 'api', 'ops', mock_payment_service, mock_errows_service ]
});

describe('pixel configuration', () => {
  test('add, update and query pixel config', async ({ server, sysadmin_token }) => {
    // 查询初始 pixel 配置列表，应该为空
    const initialList = await listPixelConfigs(server, sysadmin_token);
    expect(initialList).toHaveProperty('count', expect.any(Number));
    expect(initialList).toHaveProperty('data', expect.any(Array));
    expect(initialList.count).toEqual(0);
    expect(initialList.data.length).toEqual(0);

    // 添加第一个 pixel 配置
    const pixel1 = {
      pixel_id: 'test-pixel-001',
      access_token: 'token-001',
      remark: 'Test pixel 1'
    };
    await updatePixelConfig(server, sysadmin_token, pixel1.pixel_id, pixel1.access_token, pixel1.remark);

    // 添加第二个 pixel 配置
    const pixel2 = {
      pixel_id: 'test-pixel-002',
      access_token: 'token-002',
      remark: 'Test pixel 2'
    };
    await updatePixelConfig(server, sysadmin_token, pixel2.pixel_id, pixel2.access_token, pixel2.remark);

    // 查询配置列表，验证添加成功
    const afterAddList = await listPixelConfigs(server, sysadmin_token);
    expect(afterAddList.count).toEqual(2);
    expect(afterAddList.data.length).toEqual(2);

    // 验证数据结构和内容
    afterAddList.data.forEach(item => {
      expect(item).toHaveProperty('pixel_id', expect.any(String));
      expect(item).toHaveProperty('access_token', expect.any(String));
      expect(item).toHaveProperty('remark', expect.any(String));
    });

    const foundPixel1 = afterAddList.data.find(p => p.pixel_id === pixel1.pixel_id);
    expect(foundPixel1).toBeDefined();
    expect(foundPixel1.access_token).toEqual(pixel1.access_token);
    expect(foundPixel1.remark).toEqual(pixel1.remark);

    // 更新第一个 pixel 配置
    const updatedPixel1 = {
      pixel_id: pixel1.pixel_id,
      access_token: 'token-001-updated',
      remark: 'Updated test pixel 1'
    };
    await updatePixelConfig(
      server, sysadmin_token,
      updatedPixel1.pixel_id, updatedPixel1.access_token, updatedPixel1.remark
    );

    // 查询验证更新成功
    const afterUpdateList = await listPixelConfigs(server, sysadmin_token);
    expect(afterUpdateList.count).toEqual(2); // 数量不变

    const updatedFound = afterUpdateList.data.find(p => p.pixel_id === pixel1.pixel_id);
    expect(updatedFound).toBeDefined();
    expect(updatedFound.access_token).toEqual(updatedPixel1.access_token);
    expect(updatedFound.remark).toEqual(updatedPixel1.remark);

    // 测试分页功能
    const pagedList = await listPixelConfigs(server, sysadmin_token, { page: 0, size: 1 });
    expect(pagedList.count).toEqual(2); // 总数不变
    expect(pagedList.data.length).toEqual(1); // 只返回一条
  });

  test('unauthorized user cannot manage pixel config', async ({ server, token }) => {
    await expect(
      updatePixelConfig(server, token, 'test-pixel', 'token', 'remark')
    ).rejects.toMatchObject({ status: 403 });

    await expect(
      listPixelConfigs(server, token)
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('pixel tracking', () => {
  test(
    'bind and retrieve pixel data',
    async ({ server, token, pixel_config }) => {
      const { id: pixel_id, access_token } = pixel_config;

      const pixelData = {
        pixel_id,
        s: 'source-value',
        c: 'campaign-value',
        g: 'group-value',
        ad: 'ad-value',
        acc: 'account-value',
        fbclid: 'facebook-click-id'
      };

      const userAgent = 'test-user-agent-string';
      const ip = '127.0.0.1';
      const referrer = 'https://example.com/some-page';

      // bind pixel
      await bindPixel(server, token, pixelData, {
        'user-agent': userAgent,
        'x-forwarded-for': ip,
        referer: referrer
      });

      // retrieve pixel in profile
      const profile = await userProfile(server, token);
      expect(profile).toHaveProperty('pixel');
      expect(profile.pixel).toMatchObject(pixelData);

      // verify pixel tracking called
      expect(pixelMethods.pixelTrack).toHaveBeenCalledExactlyOnceWith(
        pixel_id,
        access_token,
        expect.arrayContaining([
          expect.objectContaining({
            event_name: 'CompleteRegistration',
            event_time: expect.any(Number),
            event_id: `register.${profile.id}`,
            user_data: expect.objectContaining({
              external_id: profile.id,
              client_ip_address: ip,
              client_user_agent: userAgent
            }),
            event_source_url: referrer,
            action_source: 'website'
          })
        ])
      );
    });

  test(
    'update existing pixel data',
    async ({ server, token, sysadmin_token, pixel_config }) => {
      const { id: pixel_id } = pixel_config;
      const initialPixel = {
        pixel_id,
        s: 'initial-source'
      };


      const updatedPixel = {
        pixel_id: 'updated-pixel',
        s: 'updated-source',
        c: 'new-campaign'
      };
      await updatePixelConfig(
        server, sysadmin_token,
        updatedPixel.pixel_id, 'updatedPixel.access_token',
        'Remark for update test'
      );

      // bind initial pixel
      await bindPixel(server, token, initialPixel);

      // verify initial pixel
      let profile = await userProfile(server, token);
      expect(profile.pixel).toMatchObject(initialPixel);

      // update pixel
      await bindPixel(server, token, updatedPixel);

      // verify updated pixel
      profile = await userProfile(server, token);
      expect(profile.pixel).toMatchObject(updatedPixel);
    });

  test('unauthorized user cannot bind pixel', async ({ server }) => {
    const pixelData = {
      pixel_id: 'test-pixel',
      s: 'source'
    };

    await expect(
      bindPixel(server, 'invalid-token', pixelData)
    ).rejects.toThrow('401 - PUT /user/pixel');
  });
});