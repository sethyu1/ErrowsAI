import { fetch, FormData } from 'undici';
import crypto from 'node:crypto';
import { User, Configuration } from '@errows/models';
import { CONFIGURATION_SCOPE } from './constrains.mjs';
import { configurationErrorHandler, userErrorHandler } from './error.mjs';

function hash(val) {
  if (!val) return undefined;
  return crypto.createHash('sha256').update(val.toString().trim().toLowerCase()).digest('hex');
}

function constructUserData(user, meta) {
  const { ipAddress, userAgent } = meta;
  const pixel = user.pixel || {};
  const profile = user.profile || {};

  const email = hash(user.email);
  const firstName = hash(profile.name?.split(' ')[0]);
  const lastName = hash(profile.name?.split(' ').slice(1).join(' '));
  const gender = profile.gender === 'male' ? hash('m') : (profile.gender === 'female' ? hash('f') : undefined);

  return {
    client_ip_address: ipAddress || '',
    client_user_agent: userAgent || '',
    external_id: user.uid,
    em: email,
    fn: firstName,
    ln: lastName,
    ge: gender,
    fbc: pixel.fbclid || undefined,
  };
}

function constructRedditUserData(user, meta) {
  const { ipAddress, userAgent } = meta;
  const pixel = user.pixel || {};
  return {
    ip_address: ipAddress || '',
    user_agent: userAgent || '',
    email: hash(user.email) || undefined,
    external_id: user.uid,
    click_id: pixel.rdt_cid || undefined,
  };
}


export const methods = {
  async pixelTrack(id, access_token, data) {
    const formData = new FormData();
    formData.append('access_token', access_token);
    formData.append('data', JSON.stringify(data));
    const url = `https://graph.facebook.com/v24.0/${id}/events`;

    this.logger.info(`Sending Pixel event to ${id}`, { data });

    const res = await fetch(url, { method: 'POST', body: formData });
    const resText = await res.text();

    if (!res.ok) {
      this.logger.error(`Pixel tracking failed [${res.status}]: ${resText}`);
      throw new Error(
        `Pixel tracking failed with status ${res.status}, response: ${resText}`
      );
    }

    this.logger.info(`Pixel tracking success for ${id}: ${resText}`);

    try {
      return JSON.parse(resText);
    } catch (e) {
      return resText;
    }
  },

  async redditTrack(pixel_id, access_token, events) {
    const url = `https://ads-api.reddit.com/api/v3/pixels/${pixel_id}/conversion_events`;
    const body = { data: { events } };

    this.logger.info(`Reddit redditTrack: url=${url} access_token=${access_token} payload=${JSON.stringify(body)}`);

    const controller = new AbortController();
    const timeoutMs = 20000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    const resText = await res.text();

    if (!res.ok) {
      this.logger.error(`Reddit tracking failed [${res.status}]: ${resText}`);
      throw new Error(
        `Reddit tracking failed with status ${res.status}, response: ${resText}`
      );
    }

    try {
      return JSON.parse(resText);
    } catch (e) {
      return resText;
    }
  }
};

export default {
  // 绑定 pixel
  user_pixel_bind: {
    rest: 'PUT /pixel',
    params: {
      pixel_id: { type: 'string', optional: true },
      s: { type: 'string', optional: true },
      c: { type: 'string', optional: true },
      g: { type: 'string', optional: true },
      ad: { type: 'string', optional: true },
      acc: { type: 'string', optional: true },
      pixel: { type: 'string', optional: true },
      fbclid: { type: 'string', optional: true },
      r_pixel_id: { type: 'string', optional: true },
      rdt_cid: { type: 'string', optional: true },
      clickid: { type: 'string', optional: true },
      siteid: { type: 'string', optional: true }
    },
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const incoming = ctx.params;
      const schema = this.buildSchema();

      const profile = await ctx.call('user.profile', {}, { meta: { user: { uid } } });
      const existing = profile.pixel && typeof profile.pixel === 'object' ? profile.pixel : {};
      const merged = { ...existing };
      const metaKeys = ['pixel_id', 'pixel', 's', 'c', 'g', 'ad', 'acc', 'fbclid', 'clickid', 'siteid'];
      const redditKeys = ['r_pixel_id', 'rdt_cid'];
      for (const k of [...metaKeys, ...redditKeys]) {
        if (incoming[k] !== undefined && incoming[k] !== null && String(incoming[k]).trim() !== '') {
          merged[k] = String(incoming[k]).trim();
        }
      }

      await User.bindPixel(this.pool, schema, uid, merged)
        .then(res => res, userErrorHandler);

      if (merged.pixel_id || merged.pixel) {
        const metaPixel = { ...merged, pixel_id: merged.pixel_id || merged.pixel };
        await ctx.call('user.pixel_user_register', metaPixel, { meta: ctx.meta })
          .catch(err => {
            this.logger.error('Error during pixel user registration tracking:', err);
          });
      }

      if (merged.r_pixel_id) {
        await ctx.call('user.reddit_user_register', { r_pixel_id: merged.r_pixel_id }, { meta: ctx.meta })
          .catch(err => {
            this.logger.error('Error during Reddit user registration tracking:', err);
          });
      }

      ctx.meta.$statusCode = 204;
    }
  },

  pixel_user_register: {
    params: {
      pixel_id: 'string',
    },
    async handler(ctx) {
      const { pixel_id } = ctx.params;
      const {
        ipAddress, referrer, userAgent,
        user: { uid }
      } = ctx.meta;
      const { access_token } = await ctx.call(
        'ops.configuration_pixel_get_by_id', { id: pixel_id }
      );
      const user = await ctx.call('user.profile', {}, { meta: { user: { uid } } });
      const data = [
        {
          event_name: 'CompleteRegistration',
          event_time: Math.floor(Date.now() / 1000),
          event_id: `register.${uid}`,
          user_data: constructUserData(user, ctx.meta),
          event_source_url: referrer || '',
          action_source: 'website',
        }
      ];
      const res = await this.pixelTrack(pixel_id, access_token, data);
      this.logger.info('Pixel track response for user register event:', res);

      ctx.$statusCode = 204;
    }
  },

  pixel_checkout: {
    params: {
      payment_id: 'string',
      uid: 'string',
      product: 'object',
    },
    async handler(ctx) {
      const { payment_id, uid, product } = ctx.params;
      const {
        ipAddress, referrer, userAgent
      } = ctx.meta;
      const profile = await ctx.call('user.profile', {}, { meta: { user: { uid } } });
      const pixel_id = profile.pixel?.pixel_id ?? profile.pixel?.pixel ?? null;
      if (!pixel_id) {
        this.logger.info(`User ${uid} has no Meta pixel bound, skipping Meta checkout tracking.`);
        return;
      }

      const { access_token } = await ctx.call(
        'ops.configuration_pixel_get_by_id', { id: pixel_id }
      );

      const data = [
        {
          event_name: 'InitiateCheckout',
          event_time: Math.floor(Date.now() / 1000),
          event_id: `checkout.${payment_id}`,
          user_data: constructUserData(profile, ctx.meta),
          event_source_url: referrer || '',
          action_source: 'website',
          custom_data: {
            currency: product.currency,
            value: product.price,
            content_type: product.type,
            content_ids: [
              product.id,
              product.price_id
            ],
            product_name: product.name,
          }
        }
      ];
      const res = await this.pixelTrack(pixel_id, access_token, data);
      this.logger.info('Pixel track response for checkout event:', res);

      ctx.$statusCode = 204;
    }
  },

  pixel_purchase: {
    params: {
      payment_id: 'string',
      uid: 'string',
      event: 'object',
      product: 'object',
    },
    async handler(ctx) {
      const { payment_id, uid, event, product } = ctx.params;
      const { ipAddress, referrer, userAgent } = ctx.meta;

      const profile = await ctx.call('user.profile', {}, { meta: { user: { uid } } });
      const pixel_id = profile.pixel?.pixel_id ?? profile.pixel?.pixel ?? null;
      if (!pixel_id) {
        this.logger.info(`User ${uid} has no Meta pixel bound, skipping Meta purchase tracking.`);
        return;
      }

      this.logger.info(`Processing Meta purchase tracking for user ${uid}, pixel ${pixel_id}`);

      const { access_token } = await ctx.call(
        'ops.configuration_pixel_get_by_id', { id: pixel_id }
      );

      const object = event.data.object;
      const currency = (object.currency || 'usd').toUpperCase();
      const value = object.amount_total ? object.amount_total / 100 : 0;

      const data = [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: `purchase.${payment_id}`,
          user_data: constructUserData(profile, ctx.meta),
          event_source_url: referrer || '',
          action_source: 'website',
          custom_data: {
            currency,
            value,
            content_type: product.type,
            content_ids: [
              product.id,
              product.price_id
            ],
            product_name: product.name,
          }
        }
      ];

      this.logger.info('Sending Purchase event to Pixel:', data[0]);

      const res = await this.pixelTrack(pixel_id, access_token, data);
      this.logger.info('Pixel track response for purchase event:', res);

      ctx.$statusCode = 204;
    }
  },

  magsrv_conversion: {
    params: {
      uid: 'string'
    },
    async handler(ctx) {
      const { uid } = ctx.params;
      const profile = await ctx.call('user.profile', {}, { meta: { user: { uid } } });
      const clickid = profile.pixel?.clickid;
      if (!clickid || typeof clickid !== 'string' || !clickid.trim()) {
        this.logger.info(`User ${uid} has no clickid, skipping magsrv conversion.`);
        return;
      }
      const tag = encodeURIComponent(clickid.trim());
      const url = `http://s.magsrv.com/tag.php?goal=ca85e47cbe6d473c6828eaeb774ec439&tag=${tag}`;
      this.logger.info(`Sending magsrv conversion for user ${uid}, tag=${tag}`);
      const res = await fetch(url);
      const resText = await res.text();
      if (!res.ok) {
        this.logger.error(`Magsrv conversion failed [${res.status}]: ${resText}`);
        return;
      }
      this.logger.info(`Magsrv conversion success for user ${uid}: ${resText}`);
      ctx.$statusCode = 204;
    }
  },

  reddit_user_register: {
    params: {
      r_pixel_id: 'string',
    },
    async handler(ctx) {
      const { r_pixel_id } = ctx.params;
      const { ipAddress, userAgent, user: { uid } } = ctx.meta;
      const { access_token } = await ctx.call(
        'ops.configuration_r_pixel_get_by_id', { id: r_pixel_id }
      );
      const user = await ctx.call('user.profile', {}, { meta: { user: { uid } } });
      const events = [
        {
          event_at: Date.now(),
          action_source: 'WEBSITE',
          type: { tracking_type: 'SIGN_UP' },
          click_id: user.pixel?.rdt_cid || undefined,
          user: constructRedditUserData(user, ctx.meta),
          metadata: {
            conversion_id: `register.${uid}`,
          },
        }
      ];
      const res = await this.redditTrack(r_pixel_id, access_token, events);
      ctx.$statusCode = 204;
    }
  },

  reddit_checkout: {
    params: {
      payment_id: 'string',
      uid: 'string',
      product: 'object',
    },
    async handler(ctx) {
      const { payment_id, uid, product } = ctx.params;
      const profile = await ctx.call('user.profile', {}, { meta: { user: { uid } } });
      const r_pixel_id = profile.pixel?.r_pixel_id ?? null;
      if (!r_pixel_id) {
        this.logger.info(`User ${uid} has no Reddit pixel bound, skipping Reddit checkout tracking.`);
        return;
      }
      const { access_token } = await ctx.call(
        'ops.configuration_r_pixel_get_by_id', { id: r_pixel_id }
      );
      const events = [
        {
          event_at: Date.now(),
          action_source: 'WEBSITE',
          type: { tracking_type: 'CUSTOM', custom_event_name: 'InitiateCheckout' },
          click_id: profile.pixel?.rdt_cid || undefined,
          user: constructRedditUserData(profile, ctx.meta),
          metadata: {
            conversion_id: `checkout.${payment_id}`,
            currency: product.currency || 'USD',
            value: product.price ?? 0,
            item_count: 1,
            products: [
              { id: product.price_id || product.id, name: product.name || '', category: product.type || '' }
            ],
          },
        }
      ];
      const res = await this.redditTrack(r_pixel_id, access_token, events);
      ctx.$statusCode = 204;
    }
  },

  reddit_purchase: {
    params: {
      payment_id: 'string',
      uid: 'string',
      event: 'object',
      product: 'object',
    },
    async handler(ctx) {
      const { payment_id, uid, event, product } = ctx.params;
      const profile = await ctx.call('user.profile', {}, { meta: { user: { uid } } });
      const r_pixel_id = profile.pixel?.r_pixel_id ?? null;
      if (!r_pixel_id) {
        this.logger.info(`User ${uid} has no Reddit pixel bound, skipping Reddit purchase tracking.`);
        return;
      }
      const { access_token } = await ctx.call(
        'ops.configuration_r_pixel_get_by_id', { id: r_pixel_id }
      );
      const object = event.data.object;
      const currency = (object.currency || 'usd').toUpperCase();
      const value = object.amount_total ? object.amount_total / 100 : 0;
      const events = [
        {
          event_at: Date.now(),
          action_source: 'WEBSITE',
          type: { tracking_type: 'PURCHASE' },
          click_id: profile.pixel?.rdt_cid || undefined,
          user: constructRedditUserData(profile, ctx.meta),
          metadata: {
            conversion_id: `purchase.${payment_id}`,
            currency,
            value,
            item_count: 1,
            products: [
              { id: product.price_id || product.id, name: product.name || '', category: product.type || '' }
            ],
          },
        }
      ];
      const res = await this.redditTrack(r_pixel_id, access_token, events);
      ctx.$statusCode = 204;
    }
  }
};


export const opsActions = {
  /**
   * 添加或更新 pixel 配置
   * @param {string} pixel_id - Pixel ID
   * @param {string} access_token - Access Token
   * @param {string} remark - 备注信息
   * @returns {Promise<void>}
   */
  configuration_pixel_update: {
    rest: 'PUT /pixel',
    params: {
      pixel_id: 'string',
      access_token: 'string',
      remark: { type: 'string', optional: true }
    },
    async handler(ctx) {
      const { pixel_id, access_token, remark } = ctx.params;
      const schema = this.buildSchema();
      await Configuration.setConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.PIXEL,
        pixel_id,
        { access_token, remark }
      )
        .then(res => res, configurationErrorHandler);
    }
  },

  configuration_pixel_get_by_id: {
    params: { id: 'string' },
    async handler(ctx) {
      const { id: pixel_id } = ctx.params;
      const schema = this.buildSchema();

      const config = await Configuration.getConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.PIXEL,
        pixel_id
      )
        .then(res => res, configurationErrorHandler);

      if (!config) {
        throw new Error('Pixel configuration not found');
      }

      return {
        pixel_id,
        access_token: config.access_token,
        remark: config.remark || ''
      };
    }
  },

  /**
   * 查询 pixel 配置列表
   * @param {number} page - 页码，默认 0
   * @param {number} size - 每页数量，默认 20
   * @returns {Promise<{count: number, data: Array<{pixel_id: string, access_token: string, remark: string}>}>}
   */
  configuration_pixel_list: {
    rest: 'GET /pixel',
    params: {
      page: { type: 'number', integer: true, min: 0, optional: true, default: 0, convert: true },
      size: { type: 'number', integer: true, min: 1, max: 100, optional: true, default: 20, convert: true }
    },
    async handler(ctx) {
      const { page, size } = ctx.params;
      const schema = this.buildSchema();

      const result = await Configuration.listConfigurationsPaginated(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.PIXEL,
        page,
        size
      );

      // 转换数据格式
      const data = result.data.map(row => ({
        pixel_id: row.key,
        access_token: row.value.access_token,
        remark: row.value.remark || ''
      }));

      return { count: result.count, data };
    }
  },

  /**
   * 删除指定 pixel 配置
   * @param {string} pixel_id - Pixel ID
   * @returns {Promise<void>}
   */
  configuration_pixel_delete: {
    rest: 'DELETE /pixel/:id',
    params: {
      id: 'string'
    },
    async handler(ctx) {
      const { id: pixel_id } = ctx.params;
      const schema = this.buildSchema();
      await Configuration.deleteConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.PIXEL,
        pixel_id
      )
        .then(res => res, configurationErrorHandler);
    }
  },

  configuration_r_pixel_update: {
    rest: 'PUT /r_pixel',
    params: {
      pixel_id: 'string',
      access_token: 'string',
      remark: { type: 'string', optional: true }
    },
    async handler(ctx) {
      const { pixel_id, access_token, remark } = ctx.params;
      const schema = this.buildSchema();
      await Configuration.setConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.R_PIXEL,
        pixel_id,
        { access_token, remark }
      )
        .then(res => res, configurationErrorHandler);
    }
  },
  configuration_r_pixel_get_by_id: {
    params: { id: 'string' },
    async handler(ctx) {
      const { id: pixel_id } = ctx.params;
      const schema = this.buildSchema();
      const config = await Configuration.getConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.R_PIXEL,
        pixel_id
      )
        .then(res => res, configurationErrorHandler);
      if (!config) {
        throw new Error('Pixel configuration not found');
      }
      return {
        pixel_id,
        access_token: config.access_token,
        remark: config.remark || ''
      };
    }
  },
  configuration_r_pixel_list: {
    rest: 'GET /r_pixel',
    params: {
      page: { type: 'number', integer: true, min: 0, optional: true, default: 0, convert: true },
      size: { type: 'number', integer: true, min: 1, max: 100, optional: true, default: 20, convert: true }
    },
    async handler(ctx) {
      const { page, size } = ctx.params;
      const schema = this.buildSchema();
      const result = await Configuration.listConfigurationsPaginated(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.R_PIXEL,
        page,
        size
      );
      const data = result.data.map(row => ({
        pixel_id: row.key,
        access_token: row.value.access_token,
        remark: row.value.remark || ''
      }));
      return { count: result.count, data };
    }
  },
  configuration_r_pixel_delete: {
    rest: 'DELETE /r_pixel/:id',
    params: { id: 'string' },
    async handler(ctx) {
      const { id: pixel_id } = ctx.params;
      const schema = this.buildSchema();
      await Configuration.deleteConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.R_PIXEL,
        pixel_id
      )
        .then(res => res, configurationErrorHandler);
    }
  },

  configuration_x_pixel_update: {
    rest: 'PUT /x_pixel',
    params: {
      pixel_id: 'string',
      access_token: 'string',
      remark: { type: 'string', optional: true }
    },
    async handler(ctx) {
      const { pixel_id, access_token, remark } = ctx.params;
      const schema = this.buildSchema();
      await Configuration.setConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.X_PIXEL,
        pixel_id,
        { access_token, remark }
      )
        .then(res => res, configurationErrorHandler);
    }
  },
  configuration_x_pixel_get_by_id: {
    params: { id: 'string' },
    async handler(ctx) {
      const { id: pixel_id } = ctx.params;
      const schema = this.buildSchema();
      const config = await Configuration.getConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.X_PIXEL,
        pixel_id
      )
        .then(res => res, configurationErrorHandler);
      if (!config) {
        throw new Error('Pixel configuration not found');
      }
      return {
        pixel_id,
        access_token: config.access_token,
        remark: config.remark || ''
      };
    }
  },
  configuration_x_pixel_list: {
    rest: 'GET /x_pixel',
    params: {
      page: { type: 'number', integer: true, min: 0, optional: true, default: 0, convert: true },
      size: { type: 'number', integer: true, min: 1, max: 100, optional: true, default: 20, convert: true }
    },
    async handler(ctx) {
      const { page, size } = ctx.params;
      const schema = this.buildSchema();
      const result = await Configuration.listConfigurationsPaginated(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.X_PIXEL,
        page,
        size
      );
      const data = result.data.map(row => ({
        pixel_id: row.key,
        access_token: row.value.access_token,
        remark: row.value.remark || ''
      }));
      return { count: result.count, data };
    }
  },
  configuration_x_pixel_delete: {
    rest: 'DELETE /x_pixel/:id',
    params: { id: 'string' },
    async handler(ctx) {
      const { id: pixel_id } = ctx.params;
      const schema = this.buildSchema();
      await Configuration.deleteConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.X_PIXEL,
        pixel_id
      )
        .then(res => res, configurationErrorHandler);
    }
  }
};