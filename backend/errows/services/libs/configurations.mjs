/**
 * @fileoverview 配置管理模块 - 用于管理系统配置（关键词、生图概率等）
 * @module services/libs/configurations
 * @description 提供角色会话图像生成相关配置的管理功能
 */

import config from 'config';
import { Configuration } from '@errows/models';
import { configurationErrorHandler } from './error.mjs';
import { CONFIGURATION_SCOPE } from './constrains.mjs';
import { getMergedAIConfig, setCachedMerge } from './ai-config.mjs';

const SCOPE_MEMBER = 'member';
const SCOPE_PAYMENT = 'payment';
const SCOPE_AI = 'ai';
const KEY_COIN_FREE_BALANCE = 'coin_free_balance';
const KEY_MAX_FREE_COINS = 'max_free_coins';
const KEY_VOICE_CALL_MIN_COINS = 'voice_call_min_coins';
const KEY_AI_ENDPOINTS = 'endpoints';
const SCOPE_HOME = 'home';
const KEY_HOME_DISPLAY = 'display';

const DEFAULT_MAX_FREE_COINS = 100;
const DEFAULT_VOICE_CALL_MIN_COINS = 60;

/**
 * 配置键常量 
 */
const KEY = {
  IMAGE_TRIGGER_KEYWORDS: 'image_trigger_keywords',
  IMAGE_PROBABILITY_DEFAULT: 'image_probability_default',
  IMAGE_PROBABILITY_CHARACTER: (cid) => `image_probability_character_${cid}`,
  LEGAL_TERMS: 'terms'
};

/**
 * 配置管理 Actions
 */
export const actions = {
  /**
   * 获取会话图像关键词列表
   * @returns {Promise<string[]>} 关键词数组
   */
  configuration_session_image_keywords_get: {
    rest: 'GET /sessions/image/keywords',
    async handler() {
      const schema = this.buildSchema();
      const keywords = await Configuration.getConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.MEDIA,
        KEY.IMAGE_TRIGGER_KEYWORDS
      )
      .then(res => res, configurationErrorHandler);
      return keywords || [];
    }
  },

  /**
   * 更新会话图像关键词列表
   * @param {string[]} keywords - 关键词数组
   * @returns {Promise<void>}
   */
  configuration_session_image_keywords_update: {
    rest: 'PUT /sessions/image/keywords',
    params: {
      keywords: { type: 'array', items: 'string' }
    },
    async handler(ctx) {
      const { keywords } = ctx.params;
      const schema = this.buildSchema();
      await Configuration.setConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.MEDIA,
        KEY.IMAGE_TRIGGER_KEYWORDS,
        keywords
      )
      .then(res => res, configurationErrorHandler);
    }
  },

  /**
   * 获取默认生图概率配置
   * @returns {Promise<{turns: number, probability: number}>}
   */
  configuration_session_config_default_get: {
    rest: 'GET /sessions/image/probability/default',
    async handler() {
      const schema = this.buildSchema();
      const config = await Configuration.getConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.MEDIA,
        KEY.IMAGE_PROBABILITY_DEFAULT
      )
      .then(res => res, configurationErrorHandler);
      return config || { turns: 0, probability: 0 };
    }
  },

  /**
   * 更新默认生图概率配置
   * @param {number} turns - 生图关键词生效的对话轮数阈值
   * @param {number} probability - 生图关键词触发概率，0-100 之间的整数
   * @returns {Promise<void>}
   */
  configuration_session_config_default_update: {
    rest: 'PUT /sessions/image/probability/default',
    params: {
      turns: { type: 'number', integer: true, min: 0 },
      probability: { type: 'number', integer: true, min: 0, max: 100 }
    },
    async handler(ctx) {
      const { turns, probability } = ctx.params;
      const schema = this.buildSchema();
      await Configuration.setConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.MEDIA,
        KEY.IMAGE_PROBABILITY_DEFAULT,
        { turns, probability }
      )
      .then(res => res, configurationErrorHandler);
    }
  },

  /**
   * 获取指定角色的生图概率配置
   * @param {string} cid - 角色ID
   * @returns {Promise<{turns: number, probability: number}>}
   */
  configuration_session_config_character_get: {
    rest: 'GET /sessions/image/probability/character/:cid',
    params: {
      cid: 'string'
    },
    async handler(ctx) {
      const { cid } = ctx.params;
      const schema = this.buildSchema();
      const config = await Configuration.getConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.MEDIA,
        KEY.IMAGE_PROBABILITY_CHARACTER(cid)
      )
      .then(res => res, configurationErrorHandler);

      if (!config) {
        // 如果没有该角色的配置，返回默认配置的副本
        const defaultConfig = await Configuration.getConfiguration(
          this.pool,
          schema,
          CONFIGURATION_SCOPE.MEDIA,
          KEY.IMAGE_PROBABILITY_DEFAULT
        )
        .then(res => res, configurationErrorHandler);
        return defaultConfig || { turns: 0, probability: 0 };
      }

      return config;
    }
  },

  /**
   * 更新指定角色的生图概率配置
   * @param {string} cid - 角色ID
   * @param {number} turns - 生图关键词生效的对话轮数阈值
   * @param {number} probability - 生图关键词触发概率，0-100 之间的整数
   * @returns {Promise<void>}
   */
  configuration_session_config_character_update: {
    rest: 'PUT /sessions/image/probability/character/:cid',
    params: {
      cid: 'string',
      turns: { type: 'number', integer: true, min: 0 },
      probability: { type: 'number', integer: true, min: 0, max: 100 }
    },
    async handler(ctx) {
      const { cid, turns, probability } = ctx.params;
      const schema = this.buildSchema();
      await Configuration.setConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.MEDIA,
        KEY.IMAGE_PROBABILITY_CHARACTER(cid),
        { turns, probability }
      )
      .then(res => res, configurationErrorHandler);
    }
  },

  /**
   * 获取法律条款列表
   * @returns {Promise<Array<{name: string, content: string}>>}
   */
  configuration_legal_terms_get: {
    rest: 'GET /legals',
    async handler() {
      const schema = this.buildSchema();
      const terms = await Configuration.getConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.LEGAL,
        KEY.LEGAL_TERMS
      )
      .then(res => res, configurationErrorHandler);
      return terms || [];
    }
  },

  /**
   * 更新法律条款列表
   * @param {Array<{name: string, content: string}>} terms - 法律条款数组
   * @returns {Promise<void>}
   */
  configuration_legal_terms_update: {
    rest: 'PUT /legals',
    params: {
      terms: {
        type: 'array',
        items: {
          type: 'object',
          props: {
            name: 'string',
            content: 'string'
          }
        }
      }
    },
    async handler(ctx) {
      const { terms } = ctx.params;
      const schema = this.buildSchema();
      await Configuration.setConfiguration(
        this.pool,
        schema,
        CONFIGURATION_SCOPE.LEGAL,
        KEY.LEGAL_TERMS,
        terms
      )
      .then(res => res, configurationErrorHandler);
    }
  },

  /**
   * 获取代币相关配置（初始免费币、免费币上限、语音通话最低币）
   * GET /ops/config/coin-settings
   */
  configuration_coin_settings_get: {
    rest: 'GET /config/coin-settings',
    async handler() {
      const schema = this.buildSchema();
      const client = await this.pool.connect();
      try {
        const [coinFreeBalance, maxFreeCoins, voiceCallMinCoins] = await Promise.all([
          Configuration.getConfiguration(client, schema, SCOPE_MEMBER, KEY_COIN_FREE_BALANCE),
          Configuration.getConfiguration(client, schema, SCOPE_PAYMENT, KEY_MAX_FREE_COINS),
          Configuration.getConfiguration(client, schema, SCOPE_PAYMENT, KEY_VOICE_CALL_MIN_COINS),
        ]);
        const n = (v) => (v != null && Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : null);
        return {
          coin_free_balance: n(coinFreeBalance) ?? config.member?.coin_free_balance ?? 50,
          max_free_coins: n(maxFreeCoins) ?? DEFAULT_MAX_FREE_COINS,
          voice_call_min_coins: n(voiceCallMinCoins) ?? DEFAULT_VOICE_CALL_MIN_COINS,
        };
      } finally {
        client.release();
      }
    }
  },

  /**
   * 更新代币相关配置
   * PUT /ops/config/coin-settings
   */
  configuration_coin_settings_update: {
    rest: 'PUT /config/coin-settings',
    params: {
      coin_free_balance: { type: 'number', integer: true, min: 0, optional: true },
      max_free_coins: { type: 'number', integer: true, min: 0, optional: true },
      voice_call_min_coins: { type: 'number', integer: true, min: 0, optional: true },
    },
    async handler(ctx) {
      const { coin_free_balance, max_free_coins, voice_call_min_coins } = ctx.params;
      const schema = this.buildSchema();
      const client = await this.pool.connect();
      try {
        if (coin_free_balance !== undefined) {
          await Configuration.setConfiguration(client, schema, SCOPE_MEMBER, KEY_COIN_FREE_BALANCE, Math.max(0, Math.floor(coin_free_balance)));
        }
        if (max_free_coins !== undefined) {
          await Configuration.setConfiguration(client, schema, SCOPE_PAYMENT, KEY_MAX_FREE_COINS, Math.max(0, Math.floor(max_free_coins)));
        }
        if (voice_call_min_coins !== undefined) {
          await Configuration.setConfiguration(client, schema, SCOPE_PAYMENT, KEY_VOICE_CALL_MIN_COINS, Math.max(0, Math.floor(voice_call_min_coins)));
        }
        return await ctx.call('ops.configuration_coin_settings_get');
      } finally {
        client.release();
      }
    }
  },

  /**
   * 获取 AI 服务地址配置（image, chat, stream, video, tts；不含 voiceCall）
   * GET /ops/config/ai-endpoints
   */
  configuration_ai_endpoints_get: {
    rest: 'GET /config/ai-endpoints',
    async handler() {
      const schema = this.buildSchema();
      const client = await this.pool.connect();
      try {
        const merged = await getMergedAIConfig(client, schema);
        return merged;
      } finally {
        client.release();
      }
    }
  },

  /**
   * 更新 AI 服务地址配置
   * PUT /ops/config/ai-endpoints
   */
  configuration_ai_endpoints_update: {
    rest: 'PUT /config/ai-endpoints',
    params: {
      image: { type: 'object', optional: true, props: { endpoint: { type: 'string', optional: true }, baseUrl: { type: 'string', optional: true } } },
      chat: { type: 'object', optional: true, props: { endpoint: { type: 'string', optional: true } } },
      stream: { type: 'object', optional: true, props: { endpoint: { type: 'string', optional: true } } },
      video: { type: 'object', optional: true, props: { endpoint: { type: 'string', optional: true }, video_state: { type: 'string', optional: true }, baseUrl: { type: 'string', optional: true } } },
      tts: { type: 'object', optional: true, props: { endpoint: { type: 'string', optional: true }, baseUrl: { type: 'string', optional: true } } },
    },
    async handler(ctx) {
      const { image, chat, stream, video, tts } = ctx.params;
      const schema = this.buildSchema();
      const client = await this.pool.connect();
      try {
        const payload = { image: image ?? {}, chat: chat ?? {}, stream: stream ?? {}, video: video ?? {}, tts: tts ?? {} };
        await Configuration.setConfiguration(client, schema, SCOPE_AI, KEY_AI_ENDPOINTS, payload);
        setCachedMerge(null);
        return await ctx.call('ops.configuration_ai_endpoints_get');
      } finally {
        client.release();
      }
    }
  },

  /**
   * 获取首页与轮盘配置（banner、carousel、top_character_ids）
   * GET /ops/config/home-display 或 GET /config/home-display（公开）
   */
  configuration_home_display_get: {
    rest: 'GET /config/home-display',
    async handler() {
      const schema = this.buildSchema();
      const client = await this.pool.connect();
      try {
        const raw = await Configuration.getConfiguration(client, schema, SCOPE_HOME, KEY_HOME_DISPLAY);
        const defaultBannerUrl = 'https://butter1.s3.us-east-1.amazonaws.com/banner.webp';
        const defaultConfig = {
          banner: { images: [{ url: defaultBannerUrl }] },
          carousel: { slots: [] },
          top_character_ids: []
        };
        if (!raw || typeof raw !== 'object') return defaultConfig;
        return {
          banner: raw.banner && typeof raw.banner === 'object' ? raw.banner : defaultConfig.banner,
          carousel: raw.carousel && typeof raw.carousel === 'object' ? { slots: Array.isArray(raw.carousel.slots) ? raw.carousel.slots : [] } : defaultConfig.carousel,
          top_character_ids: Array.isArray(raw.top_character_ids) ? raw.top_character_ids : defaultConfig.top_character_ids
        };
      } finally {
        client.release();
      }
    }
  },

  /**
   * 更新首页与轮盘配置
   * PUT /ops/config/home-display
   * Body: { banner?, carousel?, top_character_ids? } (partial or full). Merges with existing.
   *
   * Where the banner is stored (database):
   *   Table:  {schema}.configurations  (schema = config.scope, e.g. "v1")
   *   Row:    scope = 'home', key = 'display'
   *   Column: value (JSONB) = { banner: { images: [{ url, title?, link? }] }, carousel: { slots }, top_character_ids }
   * To verify after save:  SELECT scope, key, value FROM "{schema}".configurations WHERE scope = 'home' AND key = 'display';
   */
  configuration_home_display_update: {
    rest: 'PUT /config/home-display',
    // Permissive schema so nested url/title/link are not stripped by validator
    params: {
      banner: {
        type: 'object',
        optional: true,
        props: {
          images: {
            type: 'array',
            optional: true,
            items: {
              type: 'object',
              props: {
                url: { type: 'string', optional: true },
                title: { type: 'string', optional: true },
                link: { type: 'string', optional: true }
              }
            }
          }
        }
      },
      carousel: {
        type: 'object',
        optional: true,
        props: {
          slots: {
            type: 'array',
            optional: true,
            items: {
              type: 'object',
              props: {
                character_id: { type: 'string', optional: true },
                image_url: { type: 'string', optional: true },
                title: { type: 'string', optional: true },
                link: { type: 'string', optional: true },
                order: { type: 'number', optional: true }
              }
            }
          }
        }
      },
      top_character_ids: { type: 'array', optional: true, items: 'string' }
    },
    async handler(ctx) {
      // Body is in ctx.params (moleculer-web puts parsed JSON body here for PUT)
      const body = ctx.params && typeof ctx.params.body === 'object' ? ctx.params.body : ctx.params;
      const { banner, carousel, top_character_ids } = body || {};
      const schema = this.buildSchema();
      const client = await this.pool.connect();
      try {
        const existing = await Configuration.getConfiguration(client, schema, SCOPE_HOME, KEY_HOME_DISPLAY);
        const defaultBannerUrl = 'https://butter1.s3.us-east-1.amazonaws.com/banner.webp';
        const defaultConfig = {
          banner: { images: [{ url: defaultBannerUrl }] },
          carousel: { slots: [] },
          top_character_ids: []
        };
        const prev = existing && typeof existing === 'object' ? existing : defaultConfig;
        const payload = {
          banner: banner != null && typeof banner === 'object' ? { images: Array.isArray(banner.images) ? banner.images : (prev.banner && prev.banner.images) || [] } : (prev.banner || defaultConfig.banner),
          carousel: carousel != null && typeof carousel === 'object' ? { slots: Array.isArray(carousel.slots) ? carousel.slots : (prev.carousel && prev.carousel.slots) || [] } : (prev.carousel || defaultConfig.carousel),
          top_character_ids: Array.isArray(top_character_ids) ? top_character_ids : (prev.top_character_ids || defaultConfig.top_character_ids)
        };
        await Configuration.setConfiguration(client, schema, SCOPE_HOME, KEY_HOME_DISPLAY, payload);
        return await ctx.call('ops.configuration_home_display_get');
      } finally {
        client.release();
      }
    }
  },
};
