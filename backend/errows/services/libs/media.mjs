/**
 * @fileoverview 角色媒体 Action 定义
 * @module services/libs/media
 * @description 提供角色的图像和视频生成功能
 */

import { randomUUID } from 'node:crypto';
import path from 'node:path';
import moleculer from 'moleculer';
import { Character, Media } from '@errows/models';
import { characterErrorHandler } from './error.mjs';
import { readCharacterImageGenSteps } from './settings.mjs';
import { imageQueue, videoGenCheckQueue, videoGenQueue } from './queue.mjs';
import { resolveAIImageUrl, resolveAIVideoUrl } from './utils.mjs';
import { member_events, ai_metrics_constants } from './constrains.mjs';

const { MoleculerClientError } = moleculer.Errors;
const { MEDIA_IMAGES, MEDIA_VIDEOS } = member_events;

const list_media_query = {
  type: 'object',
  properties: {
    sort: {
      type: 'string', optional: true,
      enum: ['count', 'created_at', 'alphabetical'],
      default: 'created_at'
    },
    q: { type: 'string', optional: true, trim: true },
    status: { type: 'string', optional: true, enum: ['deleted'] },
    filters: {
      type: 'array',
      optional: true,
      items: { type: 'tuple', items: ['string', 'string[]'] }
    },
  }
};

const list_character_media_query = {
  type: 'object',
  properties: {
    sort: {
      type: 'string', optional: true,
      enum: ['created_at'],
      default: 'created_at'
    },
    order: {
      type: 'string', optional: true,
      enum: ['asc', 'desc'], default: 'desc'
    }
  }
};

export default {

  /**
   * 获取角色图像生成选项
   * @action character_image_gen_options
   * @returns {Promise<Object>} 图像生成配置选项
   *
   * @description
   * 获取AI图像生成时可用的所有选项配置
   * 包括服装、背景、动作等可选参数
   *
   */
  character_image_gen_options: {
    async handler() {
      const res = await readCharacterImageGenSteps();
      return res;
    }
  },
  /**
   * 创建角色图像生成任务
   * @action character_image_gen_task_create
   * @requires 用户认证
   *
   * @description
   * 创建一个角色图像生成任务
   * 任务会异步执行，完成后触发 character_image_gen 事件
   *
   */
  character_image_gen_task_create: {
    params: {
      cid: 'uuid',
      outfit: { type: 'array', items: 'string', optional: true },
      background: { type: 'array', items: 'string', optional: true },
      action: { type: 'array', items: 'string', optional: true },
      prompt: { type: 'string', optional: true },
    },
    async handler(ctx) {
      const settings = ctx.params;
      const task_id = randomUUID();
      await this.deductCoinsByImageGen(ctx, task_id);

      const { cid, outfit, background, action, prompt } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      const { avatar_url } = await Character.get(
        this.pool, schema, cid, uid
      ).then(res => res, characterErrorHandler);

      const character_setting = await Character.getSetting(this.pool, schema, cid)
      .then(res => res, characterErrorHandler);

      const task_settings = { outfit, background, action, prompt };

      const task = await Media
      .createImageGenerationTask(
        this.pool, schema, cid, uid, task_id, task_settings
      ).then(res => res, characterErrorHandler);

      const { id: tid } = task;

      const imageGenTimeend = this.AIRequestTimer(ai_metrics_constants.IMAGE);
      const character = Object.assign({}, character_setting, { avatar_url });
      imageQueue.append(tid, { character, settings })
      .then(
        ({ image_url }) => {
          ctx.emit('character_image_gen', { cid, uid, tid, image_url });
          imageGenTimeend(true);
        },
        error => {
          this.logger.error(
            'character image gen task failed',
            { cid, uid, tid, error }
          );
          imageGenTimeend(false);
        }
      );

      return { id : tid };
    }
  },

  character_image_gen_task_retry: {
    params: { cid: 'uuid', tid: 'uuid' },
    async handler(ctx) {
      const { cid, tid } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const task = await Media.getImageGenerationTask(
        this.pool, schema, cid, uid, tid
      )
      .then(res => res, characterErrorHandler);

      if (task.status === 'completed') {
        return { id: tid, already_completed: true };
      }

      const { avatar_url } = await Character.get(
        this.pool, schema, cid, uid
      ).then(res => res, characterErrorHandler);

      const character_setting = await Character.getSetting(this.pool, schema, cid)
      .then(res => res, characterErrorHandler);

      const character = Object.assign({}, character_setting, { avatar_url });
      const task_settings = task.setting;

      const imageGenTimeend = this.AIRequestTimer(ai_metrics_constants.IMAGE);
      imageQueue.append(tid, { character, settings: task_settings })
      .then(
        ({ image_url }) => {
          ctx.emit('character_image_gen', { cid, uid, tid, image_url });
          imageGenTimeend(true);
        },
        error => {
          this.logger.error(
            'character image gen task retry failed',
            { cid, uid, tid, error }
          );
          imageGenTimeend(false);
        }
      );

      return { id: tid };
    }
  },

  /**
   * 获取角色图像生成任务结果
   * @action character_image_gen_task_get
   *
   * @description
   * 查询图像生成任务的状态和结果
   * 如果任务未完成，asset 为 null
   *
   */
  character_image_gen_task_get: {
    params: { cid: 'uuid', tid: 'uuid' },
    async handler(ctx) {
      const { cid, tid } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      const task = await Media.getImageGenerationTask(
        this.pool, schema, cid, uid, tid
      )
      .then(res => res, characterErrorHandler);

      if (task.status !== 'completed') {
        return Object.assign({ asset: null }, task);
      }

      const asset = await Media.getImageById(
        this.pool, schema, tid
      ).then(res => res, characterErrorHandler);
      const url = resolveAIImageUrl(asset.url);
      const assetWithUrl = Object.assign({}, asset, { url });

      return Object.assign({ asset: assetWithUrl }, task);
    }
  },

  character_image_gen_tasks_list: {
    params: { cid: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const tasks = await Media.listImageGenTasks(
        client, schema, cid, uid
      );

      return tasks;
    }
  },

  /**
   * 获取用户的角色图像列表统计
   * @action character_image_list_stats
   * @requires 用户认证
   * @returns {Promise<Array>} 图像列表，包含角色信息
   *
   * @description
   * 获取当前用户生成的所有角色图像
   * 每个图像都会包含对应的角色摘要信息
   *
   * @example
   * const images = await broker.call('errows.character_image_list_stats');
   */
  character_image_list_stats: {
    params: { query: list_media_query },
    async handler(ctx) {
      const { query } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const res = await Media.listImagesByUser(
        client, schema, uid, query
      );

      const characterMap = await this.lookupCharacter(
        schema,
        res.map(i => i.cid)
      );

      const data = res.map(i => ({
        ...i,
        cover: resolveAIImageUrl(i.cover),
        character: characterMap.get(i.cid)
      }));

      return data;
    }
  },

  /**
   * 获取指定角色的图像列表
   * @action character_image_list_by_character
   * @requires 用户认证
   * @param {Object} ctx.params.params
   * @param {string} ctx.params.params.cid - 角色 ID
   * @returns {Promise<Array>} 该角色的所有图像
   *
   * @description
   * 获取指定角色生成的所有图像
   *
   * @example
   * const images = await broker.call('errows.character_image_list_by_character', {
   *   params: { cid: 'character-uuid' }
   * });
   */
  character_image_list_by_character: {
    params: {
      params: { type: 'object', properties: { cid: 'uuid' } },
      query: list_character_media_query
    },
    async handler(ctx) {
      const { params: { cid }, query } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const res = await Media.listImagesByCharacter(
        client, schema, cid, uid, query
      ).then(res => res, characterErrorHandler);

      return {
        count: res.count,
        data: res.data.map(i => ({
          ...i,
          url: resolveAIImageUrl(i.url)
        }))
      };
    }
  },

  /**
   * 创建角色视频生成任务
   * @action character_video_gen_task_create
   * @requires 用户认证
   * @param {string} ctx.params.cid - 角色 ID
   * @param {string} ctx.params.aid - 图像资源 ID（作为视频的基础图）
   * @returns {Promise<{id: string}>} 返回任务 ID
   *
   * @description
   * 基于已生成的角色图像创建视频生成任务
   * 视频生成是异步的，包含两个步骤：
   * 1. 提交任务到视频生成队列
   * 2. 轮询检查任务完成状态
   *
   * @example
   * const result = await broker.call('errows.character_video_gen_task_create', {
   *   cid: 'character-uuid',
   *   aid: 'image-uuid'
   * });
   */
  character_video_gen_task_create: {
    params: { cid: 'uuid', aid: 'uuid' },
    async handler(ctx) {
      const { cid, aid } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      const task_id = randomUUID();
      const {
        id: transaction_id
      } = await this.deductCoinsByVideoGen(ctx, task_id);

      const image = await Media.getImageById(
        this.pool, schema, aid
      ).then(res => res, characterErrorHandler);

      const task = await Media.createVideoGenerationTask(
        this.pool, schema, task_id, cid, uid, aid
      ).then(res => res, characterErrorHandler);

      const { id: tid } = task;
      await this.pool.query(
        `UPDATE "${schema}".characters_video_gen_tasks
         SET info = COALESCE(info, '{}'::jsonb) || $2::jsonb
         WHERE id = $1`,
        [tid, JSON.stringify({ transaction_id })]
      );
      const image_url = path.basename(image.url);

      const videoGenTimeend = this.AIRequestTimer(ai_metrics_constants.VIDEO);
      videoGenQueue.append(tid, { image_url })
      .then(
        ({ request_id }) => {
          ctx.emit(
            'character_video_gen',
            { cid, uid, aid, tid, transaction_id, request_id }
          );
          videoGenTimeend(true);
        },
        error => {
          videoGenTimeend(false);
          ctx.emit(
            'character_video_gen_failed',
            { cid, uid, aid, tid, transaction_id, error }
          );
        }
      );

      return { id : tid };
    }
  },

  character_video_gen_task_retry: {
    params: { cid: 'uuid', tid: 'uuid' },
    async handler(ctx) {
      const { cid, tid } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      let task = await Media.getVideoGenerationTask(
        this.pool, schema, cid, uid, tid
      ).then(res => res, characterErrorHandler);

      if (task.status === 'completed') {
        return { id: tid, already_completed: true };
      }
      if (task.status === 'failed') {
        const { rowCount } = await this.pool.query(
          `UPDATE "${schema}".characters_video_gen_tasks
           SET
             status = 'pending',
             updated_at = NOW(),
             info = COALESCE(info, '{}'::jsonb) - 'error'
           WHERE id = $1 AND cid = $2 AND uid = $3 AND status = 'failed'`,
          [tid, cid, uid]
        );
        if (rowCount === 0) {
          throw new MoleculerClientError('Video task not found', 404);
        }
        task = await Media.getVideoGenerationTask(
          this.pool, schema, cid, uid, tid
        ).then(res => res, characterErrorHandler);
      }

      const aid = task.image_id;
      const rawInfo = task.info;
      const info = rawInfo && typeof rawInfo === 'object' && !Array.isArray(rawInfo)
        ? rawInfo
        : {};
      const transaction_id = info.transaction_id ?? null;
      const request_id = info.request_id ?? null;

      const image = await Media.getImageById(
        this.pool, schema, aid
      ).then(res => res, characterErrorHandler);
      const image_url = path.basename(image.url);

      const toFailPayload = (err) => (
        err instanceof Error
          ? err
          : new Error(typeof err === 'string' ? err : JSON.stringify(err))
      );

      if (task.status === 'generating' && request_id) {
        const videoCheckTimeend = this.AIRequestTimer(ai_metrics_constants.VIDEO);
        videoGenCheckQueue.append(tid, { request_id })
        .then(
          (result) => {
            videoCheckTimeend(true);
            ctx.emit(
              'character_video_gen_complete',
              {
                cid, uid, aid, tid,
                video_url: result.video_url,
                result: result.result
              }
            );
          },
          (error) => {
            videoCheckTimeend(false);
            ctx.emit(
              'character_video_gen_failed',
              {
                cid, uid, aid, tid,
                transaction_id,
                error: toFailPayload(error)
              }
            );
          }
        );
      } else {
        const videoGenTimeend = this.AIRequestTimer(ai_metrics_constants.VIDEO);
        videoGenQueue.append(tid, { image_url })
        .then(
          ({ request_id: new_request_id }) => {
            videoGenTimeend(true);
            ctx.emit(
              'character_video_gen',
              {
                cid, uid, aid, tid,
                transaction_id,
                request_id: new_request_id
              }
            );
          },
          (error) => {
            videoGenTimeend(false);
            ctx.emit(
              'character_video_gen_failed',
              {
                cid, uid, aid, tid,
                transaction_id,
                error: toFailPayload(error)
              }
            );
          }
        );
      }

      return { id: tid };
    }
  },

  character_task_speed_up: {
    params: { tid: 'uuid' },
    async handler(ctx) {
      const { tid } = ctx.params;
      return await this.deductCoinsBySpeedUp(ctx, tid);
    }
  },

  /**
   * 获取角色视频生成任务结果
   * @action character_video_gen_task_get
   * @requires 用户认证
   * @param {string} ctx.params.cid - 角色 ID
   * @param {string} ctx.params.aid - 图像资源 ID
   * @returns {Promise<Object>} 任务状态和结果
   * @returns {string} return.status - 任务状态（pending/processing/completed/failed）
   * @returns {Object|null} return.asset - 生成的视频资源（完成时）
   *
   * @description
   * 查询视频生成任务的状态和结果
   * 视频生成通常需要几分钟时间
   *
   * @example
   * const task = await broker.call('errows.character_video_gen_task_get', {
   *   cid: 'character-uuid',
   *   aid: 'image-uuid'
   * });
   */
  character_video_tasks_get: {
    params: { cid: 'uuid', tid: 'uuid' },
    async handler(ctx) {
      const { cid, tid } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      const task = await Media.getVideoGenerationTask(
        this.pool, schema, cid, uid, tid
      ).then(res => res, characterErrorHandler);

      Object.assign(task, { cover: resolveAIImageUrl(task.cover) });

      if (task.status !== 'completed') {
        return Object.assign({ asset: null }, task);
      }

      const asset = await Media.getVideoById(
        this.pool, schema, tid, uid
      ).then(res => res, characterErrorHandler);

      Object.assign(
        asset,
        {
          url: resolveAIVideoUrl(asset.url),
          cover: resolveAIImageUrl(asset.cover)
        }
      );

      return Object.assign({ asset }, task);
    }
  },

  character_video_tasks_list: {
    params: { cid: 'uuid' },
    async handler(ctx) {
      const { cid } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const tasks = await Media.listNotCompletedVideoGenTasks(
        client, schema, cid, uid
      );

      return tasks.map(task => {
        return Object.assign(task, { cover: resolveAIImageUrl(task.cover) });
      });
    }
  },

  /**
   * 获取用户的角色视频列表统计
   * @action character_video_list_stats
   * @requires 用户认证
   * @returns {Promise<Array>} 视频列表，包含角色信息
   *
   * @description
   * 获取当前用户生成的所有角色视频
   * 每个视频都会包含对应的角色摘要信息
   *
   * @example
   * const videos = await broker.call('errows.character_video_list_stats');
   */
  character_video_list_stats: {
    params: { query: list_media_query },
    async handler(ctx) {
      const { query } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const res = await Media.listVideosByUser(
        client, schema, uid, query
      );

      const characterMap = await this.lookupCharacter(
        schema,
        res.map(i => i.cid)
      );

      const data = res.map(i => ({
        ...i,
        cover: resolveAIImageUrl(i.cover),
        character: characterMap.get(i.cid)
      }));

      return data;
    }
  },

  /**
   * 获取指定角色的视频列表
   * @action character_video_list_by_character
   * @requires 用户认证
   * @param {Object} ctx.params.params
   * @param {string} ctx.params.params.cid - 角色 ID
   * @returns {Promise<Array>} 该角色的所有视频
   *
   * @description
   * 获取指定角色生成的所有视频
   *
   * @example
   * const videos = await broker.call('errows.character_video_list_by_character', {
   *   params: { cid: 'character-uuid' }
   * });
   */
  character_video_list_by_character: {
    params: {
      params: { type: 'object', properties: { cid: 'uuid' } },
      query: list_character_media_query
    },
    async handler(ctx) {
      const { params: { cid }, query } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const res = await Media.listVideosByCharacter(
        client, schema, cid, uid, query
      );

      return {
        count: res.count,
        data: res.data.map(i => ({
          ...i,
          cover: resolveAIImageUrl(i.cover),
          url: resolveAIVideoUrl(i.url)
        }))
      };
    }
  },

  /**
   * 删除角色图片
   * @action character_image_delete
   * @requires 用户认证
   * @param {string} ctx.params.cid - 角色 ID
   * @param {string} ctx.params.aid - 图片资源 ID
   * @returns {Promise<void>}
   *
   * @description
   * 软删除用户的角色图片，设置 deleted_at 时间戳
   * 删除后的图片不会出现在列表查询中
   *
   */
  character_image_delete: {
    params: {
      params: { type: 'object', properties: { cid: 'uuid', aid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { cid, aid } } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      await Media.deleteImage(
        this.pool, schema, cid, uid, aid
      ).then(res => res, characterErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  },

  /**
   * 删除角色视频
   * @action character_video_delete
   * @requires 用户认证
   * @param {string} ctx.params.cid - 角色 ID
   * @param {string} ctx.params.vid - 视频资源 ID
   * @returns {Promise<void>}
   *
   * @description
   * 软删除用户的角色视频，设置 deleted_at 时间戳
   * 删除后的视频不会出现在列表查询中
   *
   */
  character_video_delete: {
    params: {
      params: { type: 'object', properties: { cid: 'uuid', vid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { cid, vid } } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      await Media.deleteVideo(
        this.pool, schema, cid, uid, vid
      ).then(res => res, characterErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  },
};

export const events = {
  /**
   * 角色头像生成完成事件
   * @event character_avatar_generate
   * @param {Object} ctx.params
   * @param {string} ctx.params.id - 角色 ID (UUID)
   * @param {string} ctx.params.uid - 用户 ID (UUID)
   * @param {string} ctx.params.image_url - 生成的图像 URL
   *
   * @description
   * 当 AI 图像生成任务完成后触发此事件
   * 将生成的图像 URL 保存到角色的 avatar_url 字段
   * 如果生成失败，会记录错误日志但不会抛出异常
   *
   * @example
   * // 由 avatarQueue 触发
   * ctx.emit('character_avatar_generate', {
   *   id: 'character-uuid',
   *   uid: 'user-uuid',
   *   image_url: 'https://s3.../avatar.jpg'
   * });
   */
  'character_avatar_generate': {
    params: { id: 'uuid', uid: 'uuid', image_url: 'string' },
    async handler(ctx) {
      const { id, uid, image_url } = ctx.params;
      const schema = this.buildSchema();
      return Character.completeGeneration(this.pool, schema, id, uid, image_url)
      .then(
        res => {
          ctx.emit('member_update_stats', { uid, data: [[MEDIA_IMAGES, 1]] });
          return res;
        },
        error => {
          this.logger.error('Failed to complete character generation', { characterId: id, error });
        }
      );
    }
  },

  /**
   * 角色图像生成完成事件
   * @event character_image_gen
   *
   * @description
   * 当用户请求生成角色图像任务完成后触发
   * 将生成的图像保存到 character_images 表
   *
   */
  'character_image_gen': {
    params: {
      cid: 'uuid', uid: 'uuid', tid: 'uuid',
      image_url: 'string'
    },
    async handler(ctx) {
      const { cid, uid, tid, image_url } = ctx.params;
      const schema = this.buildSchema();

      Media.completeImageGeneration(
        this.pool, schema,
        cid, uid, tid, image_url
      )
      .then(
        res => {
          ctx.emit('character_image_gen_done', ctx.params);
          return res;
        },
        error => {
          this.logger.error(
            'Failed to complete character image generation',
            { cid, uid, tid, error }
          );
        }
      );
    }
  },
  'character_image_gen_done': {
    async handler(ctx) {
      // 记录图片生成任务进度
      ctx.call('errows.task_character_image_gen', ctx.params)
      .catch(err => {
        this.logger.error('Error recording character image gen task progress:', err);
      });
    }
  },
  /**
   * 角色视频生成任务启动事件
   * @event character_video_gen
   *
   * @description
   * 当视频生成任务提交成功后触发
   * 保存 request_id 用于后续查询任务状态
   * 视频生成是异步过程，需要轮询检查完成状态
   *
   */
  character_video_gen: {
    params: {
      cid: 'uuid', uid: 'uuid', aid: 'uuid', tid: 'uuid',
      transaction_id: { type: 'uuid', optional: true },
      request_id: 'string'
    },
    async handler(ctx) {
      const { cid, uid, aid, tid, request_id, transaction_id } = ctx.params;
      const schema = this.buildSchema();

      return Media.startVideoGeneration(
        this.pool, schema,
        cid, uid, tid, { request_id, transaction_id }
      )
      .then(
        () => {
          ctx.emit('member_update_stats', { uid, data: [[MEDIA_VIDEOS, 1]] });
          const videoCheckTimeend = this.AIRequestTimer(ai_metrics_constants.VIDEO);
          return videoGenCheckQueue.append(tid, { request_id })
          .then(
            result => {
              videoCheckTimeend(true);
              return result;
            },
            error => {
              videoCheckTimeend(false);
              throw error;
            }
          );
        }
      )
      .then(
        ({ video_url, result }) => {
          ctx.emit(
            'character_video_gen_complete',
            { cid, uid, aid, tid, video_url, result }
          );
        },
        error => {
          ctx.emit(
            'character_video_gen_failed',
            { cid, uid, aid, tid, transaction_id, error }
          );
        }
      );
    }
  },
  /**
   * 角色视频生成完成事件
   * @event character_video_gen_complete
   *
   * @description
   * 当视频生成任务完成后触发
   * 保存生成的视频 URL 到 character_videos 表
   * result 包含完整的 API 响应，用于调试和审计
   *
   */
  character_video_gen_complete: {
    params: {
      cid: 'uuid', uid: 'uuid', aid: 'uuid', tid: 'uuid',
      video_url: 'string', result: 'object'
    },
    async handler(ctx) {
      const { cid, uid, aid, tid, video_url, result } = ctx.params;
      const schema = this.buildSchema();

      return Media.completeVideoGenTask(
        this.pool, schema,
        cid, uid, tid, video_url, result
      )
      .then(
        res => res,
        error => {
          this.logger.error(
            'Failed to complete character video generation',
            { cid, uid, aid, tid, error }
          );
        }
      );
    }
  },

  character_video_gen_failed: {
    params: {
      cid: 'uuid', uid: 'uuid', aid: 'uuid', tid: 'uuid',
      transaction_id: { type: 'uuid', optional: true },
      error: 'object'
    },
    async handler(ctx) {
      const { cid, uid, aid, tid, transaction_id, error } = ctx.params;
      const schema = this.buildSchema();

      try {
        await Media.failVideoGenTask(
          this.pool, schema,
          cid, uid, tid, error
        );
        if (transaction_id) {
          try {
            await ctx.call(
              'payment.refound_by_transition',
              { transaction_id, resource_id: tid }
            );
          } catch (refundErr) {
            this.logger.error(
              'Failed to refound coins for failed character video generation',
              { cid, uid, aid, tid, transaction_id, error: refundErr }
            );
            return;
          }
        }
        await this.pool.query(
          `UPDATE "${schema}".characters_video_gen_tasks
           SET info = (
             (COALESCE(info, '{}'::jsonb) - 'transaction_id' - 'error' - 'request_id')
             || '{"refunded": true}'::jsonb
           )
           WHERE id = $1 AND cid = $2 AND uid = $3`,
          [tid, cid, uid]
        );
      } catch (err) {
        this.logger.error(
          'Failed to mark character video generation as failed',
          { cid, uid, aid, tid, error: err }
        );
      }
    }
  }
};