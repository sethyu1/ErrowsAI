/**
 * @fileoverview 礼物管理相关操作
 * @module services/libs/gifts
 * @description 提供礼物管理功能，包括获取礼物列表、添加/更新/删除礼物等
 */

import { Gift } from '@errows/models';
import { giftErrorHandler } from './error.mjs';

/**
 * 礼物管理相关操作的 Moleculer Actions
 * @type {Object}
 */
export const opsActions = {
  /**
   * 获取礼物列表（管理端）
   * @action ops_gifts_list
   * @requires 管理员认证
   * @param {number} ctx.params.page - 页码
   * @param {number} ctx.params.size - 每页数量
   * @returns {Promise<{count: number, data: SESSION_GIFT[]}>} 礼物列表和总数
   *
   * @description
   * 获取所有礼物的分页列表，用于管理后台
   *
   * @example
   * const result = await broker.call('ops.gifts_list', { page: 0, size: 10 });
   */
  gifts_list: {
    rest: 'GET /gifts',
    params: {
      page: {
        type: 'number', integer: true, optional: true,
        minimum: 0, default: 0, convert: true
      },
      size: {
        type: 'number', integer: true, optional: true,
        minimum: 1, max: 100, default: 10, convert: true
      }
    },
    async handler(ctx) {
      const { page, size } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      const result = await Gift.listGifts(client, schema, page, size)
      .then(res => res, giftErrorHandler);

      return result;
    }
  },

  /**
   * 添加礼物
   * @action ops_gift_create
   * @requires 管理员认证
   * @param {string} ctx.params.name - 礼物名称
   * @param {string} ctx.params.picture_url - 礼物图片URL
   * @param {number} ctx.params.price - 礼物价格
   * @param {number} ctx.params.intimacy - 亲密度
   * @param {string} [ctx.params.prompt] - 赠送提示语
   * @param {boolean} ctx.params.need_claim - 是否需要领取
   * @param {number} [ctx.params.valid_days] - 有效天数
   * @returns {Promise<{id: string}>} 创建的礼物ID
   *
   * @description
   * 创建一个新礼物
   *
   * @example
   * const result = await broker.call('ops.gift_create', {
   *   name: '玫瑰',
   *   picture_url: 'https://example.com/rose.png',
   *   price: 10,
   *   intimacy: 5,
   *   need_claim: false,
   *   valid_days: null
   * });
   */
  gifts_create: {
    rest: 'POST /gifts',
    params: {
      name: { type: 'string' },
      picture_url: { type: 'string' },
      price: { type: 'number', integer: true, min: 0 },
      intimacy: { type: 'number', integer: true, min: 0 },
      prompt: { type: 'string', optional: true },
      need_claim: { type: 'boolean' },
      valid_days: { type: 'number', integer: true, min: 1, optional: true, nullable: true }
    },
    async handler(ctx) {
      const schema = this.buildSchema();
      const client = this.pool;

      const result = await Gift.createGift(client, schema, ctx.params)
      .then(res => res, giftErrorHandler);

      return result;
    }
  },

  /**
   * 更新礼物
   * @action ops_gift_update
   * @requires 管理员认证
   * @param {string} ctx.params.gift_id - 礼物ID
   * @param {string} ctx.params.name - 礼物名称
   * @param {string} ctx.params.picture_url - 礼物图片URL
   * @param {number} ctx.params.price - 礼物价格
   * @param {number} ctx.params.intimacy - 亲密度
   * @param {string} [ctx.params.prompt] - 赠送提示语
   * @param {boolean} ctx.params.need_claim - 是否需要领取
   * @param {number} [ctx.params.valid_days] - 有效天数
   * @returns {Promise<void>} 无返回值
   *
   * @description
   * 更新指定的礼物信息
   *
   * @example
   * await broker.call('ops.gift_update', {
   *   gift_id: 'uuid',
   *   name: '新名称',
   *   price: 20
   * });
   */
  gifts_update: {
    rest: 'PUT /gifts/:gift_id',
    params: {
      gift_id: 'uuid',
      name: { type: 'string' },
      picture_url: { type: 'string' },
      price: { type: 'number', integer: true, min: 0 },
      intimacy: { type: 'number', integer: true, min: 0 },
      prompt: { type: 'string', optional: true },
      need_claim: { type: 'boolean' },
      valid_days: { type: 'number', integer: true, min: 1, optional: true, nullable: true }
    },
    async handler(ctx) {
      const { gift_id, ...giftData } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      await Gift.updateGift(client, schema, gift_id, giftData)
      .then(res => res, giftErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  },

  /**
   * 删除礼物
   * @action ops_gift_delete
   * @requires 管理员认证
   * @param {string} ctx.params.gift_id - 礼物ID
   * @returns {Promise<void>} 无返回值
   *
   * @description
   * 删除指定的礼物
   *
   * @example
   * await broker.call('ops.gift_delete', {
   *   gift_id: 'uuid'
   * });
   */
  gifts_delete: {
    rest: 'DELETE /gifts/:gift_id',
    params: {
      gift_id: 'uuid'
    },
    async handler(ctx) {
      const { gift_id } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      await Gift.deleteGift(client, schema, gift_id)
      .then(res => res, giftErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  }
};
