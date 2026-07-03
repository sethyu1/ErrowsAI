/**
 * @fileoverview 帖子相关操作的 Action 定义
 * @module services/libs/posts
 * @description 提供帖子的创建、查询、删除、图片上传、评论和反馈等操作
 */

import path from 'node:path';
import fs from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import stream from 'node:stream';
import moleculer from 'moleculer';
import FastestValidator from 'fastest-validator';
import sharp from 'sharp';
import { Post, Character } from '@errows/models';
import { postErrorHandler } from './error.mjs';
import { ensureDir, resolveAssetUrl } from './utils.mjs';
import { member_events } from './constrains.mjs';
import { startOfHour } from 'date-fns';

const validator = new FastestValidator();
const { MoleculerClientError } = moleculer.Errors;

/**
 * 帖子相关操作的 Moleculer Actions
 * @type {Object}
 */
export default {
  /**
   * 上传帖子图片
   * @action post_image_upload
   * @param {Stream} ctx.params - 图片文件流
   * @param {Object} ctx.meta.$params.params
   * @param {string} ctx.meta.$params.params.cid - 角色 ID (UUID)
   * @returns {Promise<{id: string, url: string}>} 返回图片ID和完整URL
   * @throws {MoleculerClientError} 参数验证失败时抛出 400 错误
   */
  post_image_upload: {
    async handler(ctx) {
      const check = validator.compile({
        params: { type: 'object', properties: { cid: 'uuid' } }
      });
      const validateRes = check(ctx.meta.$params);
      if (validateRes !== true) {
        throw new MoleculerClientError(
          'Invalid parameters', 400, 'INVALID_PARAMETERS',
          validateRes
        );
      }

      const { user: { uid }, $params: { params: { cid } } } = ctx.meta;

      const schema = this.buildSchema();

      const id = randomUUID();
      const tempFilePath = path.join(this.temp_dir, id);

      await stream.promises.pipeline(
        ctx.params,
        sharp().webp(),
        fs.createWriteStream(tempFilePath)
      );

      const characterDir = path.join(this.upload_dir, cid);
      await ensureDir(characterDir);

      const url = `${cid}/${id}.webp`;

      await Character.addPostImage(
        this.pool, schema, cid, uid, id, url
      );

      await fs.promises.copyFile(
        tempFilePath,
        path.join(characterDir, `${id}.webp`)
      );
      await fs.promises.unlink(tempFilePath);

      return {
        id,
        url: resolveAssetUrl(url)
      };
    }
  },
  /**
   * 创建帖子
   * @action post_create
   * @requires 用户认证
   * @param {Object} ctx.params.params
   * @param {string} ctx.params.params.cid - 角色 ID (UUID)
   * @param {Object} ctx.params.body
   * @param {string} ctx.params.body.content - 帖子文本内容
   * @param {string[]} ctx.params.body.images - 图片 ID 数组（1-9张）
   * @returns {Promise<{id: string}>} 返回帖子 ID
   * @throws {ValidationError} 图片数量不在 1-9 范围内
   * @throws {NotFoundError} 角色不存在或图片不存在
   *
   * @description
   * 为指定角色创建一个新帖子
   * 帖子必须包含 1-9 张图片
   * 图片必须通过 post_image_upload 接口上传
   *
   * @example
   * const result = await broker.call('errows.post_create', {
   *   params: { cid: 'character-uuid' },
   *   body: {
   *     content: '今天去了森林探险...',
   *     images: ['img-id-1', 'img-id-2']
   *   }
   * });
   * // 返回: { id: 'post-uuid' }
   */
  post_create: {
    params: {
      params: { type: 'object', properties: { cid: 'uuid' } },
      body: {
        type: 'object',
        properties: {
          content: 'string',
          images: {
            type: 'array',
            items: 'uuid',
            min: 1,
            max: 9
          }
        }
      }
    },
    async handler(ctx) {
      const {
        params: { cid },
        body: { content, images = [] }
      } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();

      const { id } = await Post.create(
        this.pool, schema, cid, uid,
        content, images
      )
      .then(res => res, postErrorHandler);

      ctx.emit('post_created', { pid: id, cid, uid });
      ctx.emit(
        'member_update_stats',
        { uid, data: [[member_events.POSTS, 1]] },
      );
      return { id };
    }
  },
  /**
   * 获取帖子详情
   * @action post_get
   * @param {Object} ctx.params.params
   * @param {string} ctx.params.params.pid - 帖子 ID (UUID)
   * @returns {Promise<Object>} 帖子详情对象
   * @returns {string} return.id - 帖子 ID
   * @returns {string} return.content - 帖子文本内容
   * @returns {Array} return.images - 图片数组（包含 url）
   * @returns {Object} return.owner - 发布者信息
   * @returns {Object} return.character - 角色信息
   * @returns {Array} return.comments - 评论列表
   * @returns {number} return.like_count - 点赞数
   * @returns {number} return.dislike_count - 踩数
   * @returns {Date} return.created_at - 创建时间
   * @throws {NotFoundError} 帖子不存在
   *
   * @description
   * 获取帖子的完整信息，包括内容、图片、评论等
   * 返回的图片和用户信息已经被关联查询好
   *
   * @example
   * const post = await broker.call('errows.post_get', {
   *   params: { pid: 'post-uuid' }
   * });
   * // 返回: {
   * //   id: '...',
   * //   content: '内容',
   * //   images: [{ id: '...', url: '...' }],
   * //   owner: { id: '...', name: '...' },
   * //   character: { id: '...', nickname: '...' },
   * //   comments: [...],
   * //   like_count: 42
   * // }
   */
  post_get: {
    params: { pid: 'uuid' },
    async handler(ctx) {
      const { pid } = ctx.params;

      const schema = this.buildSchema();
      const post = await Post.get(this.pool, schema, pid)
      .then(res => res, postErrorHandler);

      const { cid, uid, images: img_ids, ...rest } = post;

      const charactersMap = await this.lookupCharacter(schema, [cid]);
      const usersMap = await this.lookupUsers(
        ctx,
        post.comments.map(c => c.uid).concat([uid])
      );
      const imagesMap = await this.lookupImages(schema, img_ids);

      const comments = post.comments.map(({ uid, ...rest }) => ({
        ...rest,
        owner: usersMap.get(uid)
      }));

      return Object.assign(
        rest,
        {
          images: img_ids.map(id => imagesMap.get(id)),
          owner: usersMap.get(uid),
          character: charactersMap.get(cid),
          comments
        },
      );
    }
  },
  /**
   * 获取帖子列表
   * @action post_list
   * @param {Object} [ctx.params.query] - 查询参数
   * @param {number} [ctx.params.query.page=0] - 页码（从0开始）
   * @param {number} [ctx.params.query.size=10] - 每页数量（1-100）
   * @param {string} [ctx.params.query.cid] - 过滤指定角色的帖子（可选）
   * @returns {Promise<Object>} 分页结果
   * @returns {number} return.count - 帖子总数
   * @returns {Array} return.posts - 帖子列表
   *
   * @description
   * 获取平台上的帖子列表，支持分页
   * 可以过滤指定角色的帖子
   * 每个帖子包含基本信息、创建者、角色和图片
   *
   * @example
   * const result = await broker.call('errows.post_list', {
   *   query: { page: 0, size: 20, cid: 'character-uuid' }
   * });
   * // 返回: {
   * //   count: 100,
   * //   posts: [{ id: '...', content: '...', ... }]
   * // }
   */
  post_list: {
    params: {
      page: {
        type: 'number', integer: true, optional: true,
        minimum: 0, default: 0, convert: true
      },
      size: {
        type: 'number', integer: true, optional: true,
        minimum: 1, max: 100, default: 10, convert: true
      },
      cid: {
        type: 'uuid', optional: true
      }

    },
    async handler(ctx) {
      const query = ctx.params;
      Object.assign(
        query,
        { sort: 'random', order: getRandomNumberByHour() }
      );
      const uid = ctx.meta.user?.uid ?? null;

      const schema = this.buildSchema();

      const client = await this.pool.connect();

      let data = null;
      try {
        data = await Post.list(client, schema, uid, query);
      } finally {
        await client.release();
      }

      const imagesMap = await this.lookupImages(
        schema,
        data.posts.flatMap(p => p.images)
      );

      const charactersMap = await this.lookupCharacter(
        schema,
        data.posts.map(p => p.cid)
      );

      const usersMap = await this.lookupUsers(
        ctx,
        data.posts.map(p => p.uid)
      );

      const posts = data.posts.map(({ images, uid, cid, ...p }) => ({
        ...p,
        owner: usersMap.get(uid),
        character: charactersMap.get(cid),
        images: images.map(img_id => imagesMap.get(img_id))
      }));

      return { count: data.count, posts };
    }
  },
  /**
   * 删除帖子
   * @action post_delete
   * @requires 用户认证
   * @param {Object} ctx.params.params
   * @param {string} ctx.params.params.cid - 角色 ID (UUID)
   * @param {string} ctx.params.params.pid - 帖子 ID (UUID)
   * @returns {Promise<void>} 无返回值，HTTP 204
   * @throws {NotFoundError} 帖子不存在
   * @throws {ForbiddenError} 不是帖子的创建者
   *
   * @description
   * 删除指定的帖子
   * 只有帖子的创建者可以删除
   * 删除后帖子不会在列表中显示
   *
   * @example
   * await broker.call('errows.post_delete', {
   *   params: {
   *     cid: 'character-uuid',
   *     pid: 'post-uuid'
   *   }
   * });
   */
  post_delete: {
    params: {
      params: {
        type: 'object',
        properties: { cid: 'uuid', pid: 'uuid' }
      }
    },
    async handler(ctx) {
      const { params: { cid, pid } } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      await Post.del(this.pool, schema, pid, cid, uid)
      .then(res => res, postErrorHandler);

      ctx.emit('post_deleted', { pid, cid, uid });
      ctx.emit(
        'member_update_stats',
        { uid, data: [[member_events.POSTS, -1]] },
      );

      ctx.meta.$statusCode = 204;
    }
  },
  /**
   * 对帖子进行反馈
   * @action post_feedback
   * @requires 用户认证
   * @param {string} ctx.params.pid - 帖子 ID (UUID)
   * @param {'like'|'dislike'} ctx.params.feedback - 反馈类型
   * @returns {Promise<void>} 无返回值，HTTP 204
   * @throws {NotFoundError} 帖子不存在
   *
   * @description
   * 对帖子进行点赞或踩
   * 用户只能选择一种反馈类型
   * 如果已经反馈过，会更新为新的反馈类型
   *
   * @example
   * await broker.call('errows.post_feedback', {
   *   pid: 'post-uuid',
   *   feedback: 'like'
   * });
   */
  post_feedback: {
    params: {
      pid: 'uuid',
      feedback: { type: 'string', enum: ['like', 'dislike'] }
    },
    async handler(ctx) {
      const { pid, feedback } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      await Post.feedback(this.pool, schema, pid, uid, feedback)
      .then(res => res, postErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  },
  /**
   * 创建帖子评论
   * @action post_comment_create
   * @requires 用户认证
   * @param {string} ctx.params.pid - 帖子 ID (UUID)
   * @param {string} [ctx.params.reply_to_id] - 回复的评论 ID（可选）
   * @param {string} ctx.params.content - 评论内容
   * @returns {Promise<{id: string}>} 返回评论 ID
   * @throws {NotFoundError} 帖子或被回复的评论不存在
   *
   * @description
   * 为帖子创建评论
   * 支持回复其他评论（二级评论）
   * 如果不提供 reply_to_id，则为一级评论
   *
   * @example
   * // 一级评论
   * const result = await broker.call('errows.post_comment_create', {
   *   pid: 'post-uuid',
   *   content: '很棒的帖子！'
   * });
   *
   * // 二级评论（回复）
   * const reply = await broker.call('errows.post_comment_create', {
   *   pid: 'post-uuid',
   *   reply_to_id: 'comment-uuid',
   *   content: '谢谢！'
   * });
   * // 返回: { id: 'comment-uuid' }
   */
  post_comment_create: {
    params: {
      pid: 'uuid',
      reply_to_id: { type: 'uuid', optional: true },
      content: 'string'
    },
    async handler(ctx) {
      const { pid, reply_to_id = null, content } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      const { id } = await Post.comment_create(
        this.pool, schema, pid, uid, reply_to_id, content
      )
      .then(res => res, postErrorHandler);

      // 触发评论创建事件
      ctx.emit('post_comment_created', { pid, comment_id: id });

      return { id };
    }
  }
};

export const events = {
  // 监听评论创建事件，记录评论任务进度
  post_comment_created: {
    async handler(ctx) {
      await ctx.call('errows.task_post_comment')
      .catch(err => {
        ctx.logger.error('Error handling post_comment_created event:', err);
      });
    }
  }
};

function getRandomNumberByHour() {
  const input = startOfHour(new Date()).getTime().toString();
  const hash = createHash('md5').update(input).digest('hex');
  const hexPart = hash.substring(0, 8);
  const integer = parseInt(hexPart, 16);

  // 映射到 0 - 1 之间
  return integer / 0xffffffff;
}