/**
 * @fileoverview 角色相关操作的 Action 定义
 * @module services/libs/characters
 * @description 提供角色的创建、查询、更新、删除等操作
 */

import _ from 'lodash';
import { randomUUID } from 'node:crypto';
import moleculer from 'moleculer';
import { Character } from '@errows/models';
import ai from '@errows/ai';
import { characterErrorHandler } from './error.mjs';
import { readCharacterOptions } from './settings.mjs';
import { avatarQueue } from './queue.mjs';
import { resolveAIImageUrl } from './utils.mjs';
import { member_events, ai_metrics_constants } from './constrains.mjs';

const { MEDIA_IMAGES } = member_events;

const { MoleculerClientError } = moleculer.Errors;
const {
  CHARACTERS_PRIVATE,
  CHARACTERS_DELETED,
  CHARACTERS_FOLLOWED,
  CHARACTERS_LIKED
} = member_events;

/**
 * 角色设置验证模式
 */
const characterSettings = {
  type: 'object',
  properties: {
    nickname: 'string',
    introduction: 'string|optional',
    gender: { type: 'string', enum: ['Male', 'Female'] },
    type: 'string',
    assortment: 'string',
    race: 'string',
    age: 'string',

    greeting: 'string',
    settings: 'string|optional',
    personality: 'string|optional',
    scenario: 'string|optional',
    conversation: {
      type: 'array',
      optional: true,
      min: 0,
      items: {
        type: 'object',
        properties: { user: 'string', character: 'string' }
      }
    },

    voice: { type: 'string', optional: true },
    eye_color: { type: 'string', optional: true },
    hair_style: { type: 'string', optional: true },
    hair_length: { type: 'string', optional: true },
    hair_bangs: { type: 'string', optional: true },
    hair_color: { type: 'string', optional: true },
    body_type: { type: 'string', optional: true },
    breast_size: { type: 'string', optional: true },
    butt_size: { type: 'string', optional: true },
    tags: { type: 'array', items: 'string', optional: true },
    is_official: { type: 'boolean', optional: true, default: false },
    ncover: { type: 'number', integer: true, optional: true, default: 1 },

  },
};


/**
 * 角色相关操作的 Moleculer Actions
 * @type {Object}
 */
export default {
  /**
   * 获取角色创建选项
   * @action character_creation_options
   *
   * @description
   * 从配置文件中读取角色创建时可用的所有选项
   * 这些选项用于前端表单的下拉菜单和多选框
   * 包含角色的各种属性可选值
   *
   */
  character_creation_options: {
    async handler() {
      const content = await readCharacterOptions();
      const steps = content.map((step) => ({
        ...step,
        options: step.options.map((opt) => _.omit(opt, 'settings'))
      }));

      return { options: steps };
    }
  },
  // 创建新角色
  character_create: {
    params: { body: characterSettings },
    async handler(ctx) {
      const { body: characterSettings } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      const cid = randomUUID();

      const options = await readCharacterOptions();
      const params = ai.buildModelParams(options, characterSettings);

      const { is_official = false, ncover = 1 } = characterSettings;
      const settings = { ...characterSettings, params };

      const { id } = await Character.create(this.pool, schema, uid, cid, settings, is_official, ncover)
        .then(res => res, characterErrorHandler);

      ctx.emit(
        'member_update_stats',
        { uid, data: [[CHARACTERS_PRIVATE, 1]] }
      );

      const image_settings = { ...characterSettings, params };

      const imageGenTimeend = this.AIRequestTimer(ai_metrics_constants.IMAGE);
      avatarQueue.append(id, image_settings)
        .then(
          ({ image_url }) => {
            ctx.emit('character_avatar_generate', { id, uid, image_url });
            imageGenTimeend(true);
          },
          error => {
            this.logger.error('AI image generation failed for character avatar', { characterId: id, error });
            imageGenTimeend(false);
          }
        );

      return { id };
    }
  },
  /**
   * 获取角色设置
   * @action character_settings_get
   * @requires 用户认证
   *
   * @description
   * 获取角色的完整设置信息，包括身份、风格、对话等所有属性
   * 只有角色的创建者才能访问完整设置
   * 返回的对象是扁平化的，方便前端表单编辑
   *
   */
  character_settings_get: {
    params: {
      params: { type: 'object', properties: { cid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { cid } } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      const settings = await Character.getSetting(this.pool, schema, cid)
        .then(res => res, characterErrorHandler);

      if (settings.owner_id !== uid) {
        throw new MoleculerClientError(
          'You do not have permission to access this character',
          403
        );
      }

      return settings;
    }
  },
  /**
   * 更新角色设置
   * @action character_settings_update
   *
   * @description
   * 更新角色的设置信息
   * 只有角色的创建者可以更新
   * 更新不会重新生成头像，需要单独调用头像生成接口
   *
   */
  character_settings_update: {
    params: {
      params: { type: 'object', properties: { cid: 'uuid' } },
      body: characterSettings
    },
    async handler(ctx) {
      const { body, params: { cid } } = ctx.params;
      const { user: { uid } } = ctx.meta;


      const schema = this.buildSchema();
      const settings = Character.convertToDBSetting(body);
      await Character.updateSetting(this.pool, schema, cid, uid, settings)
        .then(res => res, characterErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  },
  /**
   * 重新生成角色头像
   * @action character_avatar_gen
   *
   * @description
   * 基于当前角色设置重新生成头像
   * 用于角色设置更新后需要新头像的场景
   * 生成过程是异步的，完成后会触发 character_avatar_generate 事件
   *
   */
  character_avatar_gen: {
    params: { params: { type: 'object', properties: { cid: 'uuid' } } },
    async handler(ctx) {
      const image_id = randomUUID();
      await this.deductCoinsByImageGen(ctx, image_id);

      const { params: { cid } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const character = await Character.getSetting(this.pool, schema, cid)
        .then(res => res, characterErrorHandler);
      if (character.owner_id !== uid) {
        throw new MoleculerClientError(
          'You do not have permission to generate avatar for this character',
          403
        );
      }

      const { image_url } = await avatarQueue.append(
        cid, character
      );

      await Character.saveRebuildAvatar(
        this.pool, schema, cid, uid,
        image_id, image_url
      );

      ctx.emit('member_update_stats', { uid, data: [[MEDIA_IMAGES, 1]] });
      return { id: image_id, image_url };
    }
  },
  /**
   * 获取角色详情
   * @action character_get
   *
   * @description
   * 获取公开角色的详细信息
   * 包含角色基本信息、创建者、生成状态等
   * 如果用户已登录，还会返回点赞/关注状态
   *
   */
  character_get: {
    params: {
      cid: 'uuid'
    },
    async handler(ctx) {
      const { cid } = ctx.params;
      const uid = ctx.meta.user?.uid ?? null;

      const schema = this.buildSchema();
      const { owner_id, ...character } = await Character
        .get(this.pool, schema, cid, uid)
        .then(res => res, characterErrorHandler);

      const userMap = await this.lookupUsers(ctx, [owner_id]);
      const owner = userMap.get(owner_id);
      const status = avatarQueue.status(cid) ?? character.status;

      const avatar_url = character.avatar_url
        ? resolveAIImageUrl(character.avatar_url)
        : null;

      let first_background_image_url = null;
      if (character.background_image_files?.trim()) {
        const firstPath = character.background_image_files.split(/[,，]/).map(s => s.trim()).find(Boolean);
        if (firstPath) first_background_image_url = resolveAIImageUrl(firstPath);
      }

      return Object.assign(
        {}, character,
        { status, owner, avatar_url, first_background_image_url }
      );
    }
  },
  /**
   * 获取我的角色列表
   * @action character_list_my
   * @requires 用户认证
   *
   * @description
   * 根据类型获取用户的角色列表
   *
   */
  character_list_my: {
    params: {
      params: {
        type: 'object', properties: {
          type: {
            type: 'string',
            enum: ['owned', 'followed', 'liked', 'public', 'deleted']
          }
        }
      },
      query: {
        type: 'object', properties: {
          page: {
            type: 'number', integer: true, optional: true,
            minimum: 0, default: 0, convert: true
          },
          size: {
            type: 'number', integer: true, optional: true,
            minimum: 1, max: 100, default: 10, convert: true
          },
          q: { type: 'string', optional: true },
        }
      }
    },
    async handler(ctx) {
      const { params: { type }, query: { ...query } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      if (type === 'owned') {
        Object.assign(query, { owner_id: uid });
      } else if (type === 'deleted') {
        Object.assign(query, { owner_id: uid, status: 'deleted' });
      } else if (type === 'liked') {
        Object.assign(query, { liked_by: uid });
      } else if (type === 'followed') {
        Object.assign(query, { followed_by: uid });
      } else {
        Object.assign(query, { owner_id: uid, status: type });
      }

      const res = await Character.list(this.pool, schema, uid, query);
      const userIds = res.data.map(d => d.owner_id);
      const ownersMap = await this.lookupUsers(ctx, userIds);

      const data = res.data.map(
        ({ id, status, owner_id, avatar_url, ...rest }) => ({
          id, ...rest,
          avatar_url: avatar_url ? resolveAIImageUrl(avatar_url) : null,
          status: avatarQueue.status(id) ?? status,
          owner: ownersMap.get(owner_id)
        })
      );
      return Object.assign({}, res, { data });
    }
  },
  /**
   * 获取公开角色列表
   * @action character_list
   *
   * @description
   * 获取平台上所有公开的角色，支持多种过滤和排序
   * 不需要登录，但登录后会返回点赞/关注状态
   *
   */
  character_list: {
    params: {
      page: {
        type: 'number', integer: true, optional: true,
        minimum: 0, default: 0, convert: true
      },
      size: {
        type: 'number', integer: true, optional: true,
        minimum: 1, max: 100, default: 10, convert: true
      },
      q: { type: 'string', optional: true },
      type: { type: 'string', optional: true },
      tags: {
        type: 'array',
        optional: true,
        items: { type: 'tuple', items: ['string', 'string[]'] }
      },
      sort: {
        type: 'string', optional: true,
        enum: ['newest', 'latest', 'popular', 'most_liked', 'alphabetical'],
        default: null
      },
      recommended: { type: 'boolean', optional: true, convert: true },
    },
    async handler(ctx) {
      const { include_all_status = false } = ctx.meta;
      const query = Object.assign(
        {}, ctx.params,
        { include_pending: false },
        include_all_status ? null : { status: 'public' }
      );
      if (query.sort === undefined) query.sort = null;
      const uid = ctx.meta.user?.uid ?? null;
      const schema = this.buildSchema();
      const res = await Character.list(this.pool, schema, uid, query);

      const userIds = res.data.map(d => d.owner_id);
      const ownersMap = await this.lookupUsers(ctx, userIds);

      const data = res.data.map(({ id, status, owner_id, avatar_url, ncover, ...rest }) => ({
        id, ...rest,
        ncover,
        avatar_url: avatar_url ? resolveAIImageUrl(avatar_url) : null,
        status: avatarQueue.status(id) ?? status,
        owner: ownersMap.get(owner_id)
      }));
      return Object.assign({}, res, { data });
    }
  },
  /**
   * 删除角色（软删除）
   * @action character_delete
   *
   * @description
   * 软删除角色，状态变为 'deleted'，不会真正从数据库删除
   */
  character_delete: {
    params: {
      params: { type: 'object', properties: { cid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { cid } } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      await Character.deleteCharacter(this.pool, schema, cid, uid)
        .then(res => res, characterErrorHandler);

      ctx.emit(
        'member_update_stats',
        {
          uid,
          data: [
            [CHARACTERS_PRIVATE, -1],
            [CHARACTERS_DELETED, 1]
          ]
        }
      );

      ctx.meta.$statusCode = 204;
    }
  },
  /**
   * 更新角色状态（运营审核）
   * @action character_status_update
   * @returns {Promise<void>} 无返回值，HTTP 204
   *
   * @description
   * 运营后台修改角色状态，用于审核角色
   */
  character_status_update: {
    params: {
      cid: 'uuid',
      status: {
        type: 'string',
        enum: ['public', 'rejected', 'private']
      },
      reason: { type: 'string', optional: true }
    },
    async handler(ctx) {
      const { cid, status, reason } = ctx.params;
      const schema = this.buildSchema();

      await Character.updateStatus(this.pool, schema, cid, status, reason)
        .then(res => res, characterErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  },
  /**
   * 更新角色推荐状态（运营审核）
   * @action character_recommendation_update
   * @requires 运营权限
   *
   * @description
   * 运营后台修改角色推荐状态
   *
   */
  character_recommendation_update: {
    params: {
      cid: 'uuid',
      recommended: 'boolean'
    },
    async handler(ctx) {
      const { cid, recommended } = ctx.params;
      const schema = this.buildSchema();

      await Character.updateRecommended(this.pool, schema, cid, recommended)
        .then(res => res, characterErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  },
  /**
   * 点赞角色
   * @action character_like
   * @requires 用户认证
   * @param {string} ctx.params.cid - 角色 ID
   * @returns {Promise<void>} 无返回值，HTTP 204
   *
   * @description
   * 对角色点赞，如果已经点赞则不重复操作
   *
   * @example
   * await broker.call('errows.character_like', { cid: 'character-uuid' });
   */
  character_like: {
    params: {
      cid: 'uuid'
    },
    async handler(ctx) {
      const { cid } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      ctx.meta.$statusCode = 204;
      await Character.like(this.pool, schema, cid, uid);

      ctx.emit(
        'member_update_stats',
        { uid, data: [[CHARACTERS_LIKED, 1]] }
      );
    }
  },
  /**
   * 取消点赞角色
   * @action character_unlike
   * @requires 用户认证
   *
   */
  character_unlike: {
    params: { cid: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      ctx.meta.$statusCode = 204;
      await Character.unlike(this.pool, schema, cid, uid);

      ctx.emit(
        'member_update_stats',
        { uid, data: [[CHARACTERS_LIKED, -1]] }
      );
    }
  },
  /**
   * 关注角色
   * @action character_follow
   * @requires 用户认证
   *
   */
  character_follow: {
    params: { cid: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      ctx.meta.$statusCode = 204;
      await Character.follow(this.pool, schema, cid, uid);

      // 触发角色关注任务事件
      ctx.emit('character_follow_event', ctx.params, { meta: ctx.meta });
    }
  },
  /**
   * 取消关注角色
   * @action character_unfollow
   * @requires 用户认证
   *
   */
  character_unfollow: {
    params: { cid: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      ctx.meta.$statusCode = 204;
      await Character.unfollow(this.pool, schema, cid, uid);

      ctx.emit(
        'member_update_stats',
        { uid, data: [[CHARACTERS_FOLLOWED, -1]] }
      );
    }
  },
  /**
   * 更新角色默认排序值
   * @action character_default_order_update
   * @requires 运营权限
   * @param {string} ctx.params.cid - 角色 ID
   * @param {number} ctx.params.default_order - 默认排序值，整数，值越小排序越靠前
   * @returns {Promise<void>} 无返回值，HTTP 204
   *
   * @description
   * 运营后台设置角色的默认排序值
   * 在角色列表中，当没有指定排序方式时，会按照 default_order 排序
   *
   */
  character_default_order_update: {
    params: {
      cid: 'uuid',
      default_order: { type: 'number', integer: true, optional: true, nullable: true }
    },
    async handler(ctx) {
      const { cid, default_order } = ctx.params;
      const schema = this.buildSchema();

      ctx.meta.$statusCode = 204;
      await Character.updateDefaultOrder(this.pool, schema, cid, default_order ?? 0);
    }
  },
  /**
   * 更新角色 ncover 字段
   * @action character_ncover_update
   * @requires 运营权限
   * @param {string} ctx.params.cid - 角色 ID
   * @param {number|null} ctx.params.ncover - NSFW 标记值，整数或 null
   * @returns {Promise<void>} 无返回值，HTTP 204
   *
   * @description
   * 运营后台设置角色的 ncover 字段
   *
   */
  character_ncover_update: {
    params: {
      cid: 'uuid',
      ncover: { type: 'number', integer: true, optional: true, nullable: true }
    },
    async handler(ctx) {
      const { cid, ncover } = ctx.params;
      const schema = this.buildSchema();

      ctx.meta.$statusCode = 204;
      await Character.updateNcover(this.pool, schema, cid, ncover ?? null)
        .then(res => res, characterErrorHandler);
    }
  },

  character_is_official_update: {
    params: {
      cid: 'uuid',
      is_official: 'boolean'
    },
    async handler(ctx) {
      const { cid, is_official } = ctx.params;
      const schema = this.buildSchema();

      ctx.meta.$statusCode = 204;
      await Character.updateIsOfficial(this.pool, schema, cid, is_official)
        .then(res => res, characterErrorHandler);
    }
  },

  character_settings_get_for_ops: {
    params: { cid: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const schema = this.buildSchema();
      return Character.getSettingsForOps(this.pool, schema, cid)
        .then(res => res, characterErrorHandler);
    }
  },

  character_settings_update_ops: {
    params: {
      cid: 'uuid',
      body: {
        type: 'object',
        optional: true,
        props: {
          attributes: { type: 'object', optional: true },
          avatar_url: { type: 'string', optional: true },
          greeting_image: { type: 'string', optional: true },
          background_image_files: { type: 'string', optional: true },
          ncover: { type: 'number', optional: true }
        }
      }
    },
    async handler(ctx) {
      const { cid, body } = ctx.params;
      const schema = this.buildSchema();
      ctx.meta.$statusCode = 204;
      await Character.updateSettingOps(this.pool, schema, cid, body ?? {})
        .then(res => res, characterErrorHandler);
    }
  },
};

export const events = {
  'post_created': {
    params: { pid: 'uuid', cid: 'uuid', uid: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const client = this.pool;
      const schema = this.buildSchema();
      await Character.updatePostedCount(client, schema, cid, 1);
    }
  },

  'post_deleted': {
    params: { pid: 'uuid', cid: 'uuid', uid: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const client = this.pool;
      const schema = this.buildSchema();
      await Character.updatePostedCount(client, schema, cid, -1);
    }
  },

  'session_message_sent': {
    params: { uid: 'uuid', sid: 'uuid', cid: 'uuid', message_id: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const client = this.pool;
      const schema = this.buildSchema();
      await Character.updateDialogueCount(client, schema, cid, 1);

      await ctx.call('errows.task_message_chat', ctx.params, { meta: ctx.meta })
        .catch(error => {
          this.logger.error('Error handling session message sent event:', error);
        });
    }
  },

  'session_message_sent_image': {
    params: { uid: 'uuid', sid: 'uuid', cid: 'uuid', message_id: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const client = this.pool;
      const schema = this.buildSchema();
      await Character.updateDialogueCount(client, schema, cid, 1);
    }
  },

  'session_message_deleted': {
    params: { sid: 'uuid', mid: 'uuid', uid: 'uuid', cid: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const client = this.pool;
      const schema = this.buildSchema();
      await Character.updateDialogueCount(client, schema, cid, -1);
    }
  },

  // 监听角色关注事件，记录关注任务进度
  character_follow_event: {
    async handler(ctx) {
      ctx.call('errows.task_character_follow', ctx.params, { meta: ctx.meta })
        .catch(error => {
          this.logger.error('Error handling character follow event:', error);
        });
    }
  }
};