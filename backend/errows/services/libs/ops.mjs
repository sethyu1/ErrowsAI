import fs from 'fs-extra';
import path from 'node:path';
import stream from 'node:stream';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { default as config } from 'config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = new URL('.', import.meta.url).pathname;
import { getPayloads } from './llm-debug-store.mjs';

// S3 config for ops image upload. Read from config.aws.s3 (credentials can be overridden by env).
function getS3Config() {
  const c = config.aws?.s3;
  if (!c?.bucket) return null;
  return {
    accessKeyId: c.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: c.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    bucket: c.bucket,
    region: c.region || 'us-east-1',
    prefix: (c.prefix || 'errows/app').replace(/^\/|\/$/g, ''),
    baseUrl: (c.baseUrl || `https://${c.bucket}.s3.${c.region || 'us-east-1'}.amazonaws.com`).replace(/\/$/, ''),
  };
}

const S3_CONFIG = getS3Config();

export const methods = {
  buildSchema() {
    return config.scope;
  },

  async readPermissions() {
    if (!this.permissions) {
      const filePath = path.resolve(__dirname, '../../static/permissions.json');
      const data = await fs.promises.readFile(filePath, 'utf-8');
      this.permissions = JSON.parse(data);
    }
    return this.permissions;
  }
};

export const actions = {
  /**
   * 上传图片（运营后台）
   * @action ops_image_upload
   * @param {Stream} ctx.params - 图片文件流
   * @returns {Promise<{url: string}>} 返回图片完整URL（S3 my-bucket bucket）
   */
  image_upload: {
    async handler(ctx) {
      const id = randomUUID();
      const tempFilePath = path.join(this.temp_dir, id);

      await stream.promises.pipeline(
        ctx.params,
        sharp({ animated: true }).webp(),
        fs.createWriteStream(tempFilePath)
      );

      const filename = `${id}.webp`;
      const body = await fs.readFile(tempFilePath);
      await fs.remove(tempFilePath);

      const s3 = S3_CONFIG;
      if (!s3) throw new Error('S3 config missing (config.aws.s3)');
      const clientOpts = { region: s3.region };
      if (s3.accessKeyId && s3.secretAccessKey) {
        clientOpts.credentials = { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey };
      }
      const client = new S3Client(clientOpts);
      const key = `${s3.prefix}/${filename}`;
      await client.send(new PutObjectCommand({
        Bucket: s3.bucket,
        Key: key,
        Body: body,
        ContentType: 'image/webp'
      }));
      const url = `${s3.baseUrl}/${key}`;
      return { url };
    }
  },
  /**
   * 运营后台角色列表
   * @description 复用 errows.character_list action，但支持 status 过滤
   */
  character_ops_list: {
    rest: 'GET /characters',
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
        default: 'newest'
      },
      status: {
        type: 'string', optional: true,
        enum: ['private', 'public', 'rejected']
      }
    },
    async handler(ctx) {
      const { status, ...query } = ctx.params;

      // 如果指定了 status，添加到查询条件
      if (status) {
        query.status = status;
      }

      // 调用 errows.character_list action
      const meta = Object.assign({}, ctx.meta, { include_all_status: true });
      const result = await ctx.call('errows.character_list', query, { meta });

      return result;
    }
  },

  /**
   * 修改角色状态
   * @description 审核角色，将状态修改为 public 或 rejected
   */
  character_ops_status_update: {
    rest: 'PUT /characters/:cid/status',
    params: {
      cid: 'uuid',
      status: {
        type: 'string',
        enum: ['public', 'rejected']
      },
      reason: {
        type: 'string',
        optional: true
      }
    },
    async handler(ctx) {
      const { cid, status, reason } = ctx.params;

      // 如果状态为 rejected，必须提供拒绝原因
      if (status === 'rejected' && !reason) {
        throw new Error('Reason is required when status is rejected');
      }

      // 调用 errows 服务修改角色状态
      await ctx.call(
        'errows.character_status_update',
        { cid, status }
      );

      ctx.meta.$statusCode = 204;
    }
  },

  /**
   * 修改角色推荐状态
   * @description 设置角色是否推荐
   */
  character_ops_recommendation_update: {
    rest: 'PUT /characters/:cid/recommendation',
    params: {
      cid: 'uuid',
      recommended: 'boolean'
    },
    async handler(ctx) {
      const { cid, recommended } = ctx.params;

      // 调用 errows 服务修改角色推荐状态
      await ctx.call(
        'errows.character_recommendation_update',
        { cid, recommended }
      );

      ctx.meta.$statusCode = 204;
    }
  },

  /**
   * 更新角色默认排序值
   * @description 设置角色的默认排序值
   */
  character_ops_default_order_update: {
    rest: 'PUT /characters/:cid/order/default',
    params: {
      cid: 'uuid',
      default_order: { type: 'number', integer: true, optional: true, nullable: true }
    },
    async handler(ctx) {
      const { cid, default_order } = ctx.params;

      // 调用 errows 服务修改角色默认排序值
      await ctx.call(
        'errows.character_default_order_update',
        { cid, default_order }
      );

      ctx.meta.$statusCode = 204;
    }
  },


  character_ops_ncover_update: {
    rest: 'PUT /characters/:cid/ncover',
    params: {
      cid: 'uuid',
      ncover: { type: 'number', integer: true, optional: true, nullable: true }
    },
    async handler(ctx) {
      const { cid, ncover } = ctx.params;

      await ctx.call(
        'errows.character_ncover_update',
        { cid, ncover: ncover ?? null }
      );

      ctx.meta.$statusCode = 204;
    }
  },

  character_ops_is_official_update: {
    rest: 'PUT /characters/:cid/is_official',
    params: {
      cid: 'uuid',
      is_official: 'boolean'
    },
    async handler(ctx) {
      const { cid, is_official } = ctx.params;

      await ctx.call(
        'errows.character_is_official_update',
        { cid, is_official }
      );

      ctx.meta.$statusCode = 204;
    }
  },

  character_ops_settings_get: {
    rest: 'GET /characters/:cid/settings',
    params: { cid: 'uuid' },
    async handler(ctx) {
      return ctx.call('errows.character_settings_get_for_ops', { cid: ctx.params.cid });
    }
  },

  character_ops_settings_update: {
    rest: 'PUT /characters/:cid/settings',
    params: {
      cid: 'uuid',
      attributes: { type: 'object', optional: true },
      avatar_url: { type: 'string', optional: true },
      greeting_image: { type: 'string', optional: true },
      background_image_files: { type: 'string', optional: true },
      ncover: { type: 'number', optional: true }
    },
    async handler(ctx) {
      const { cid, attributes, avatar_url, greeting_image, background_image_files, ncover } = ctx.params;
      const body = { attributes, avatar_url, greeting_image, background_image_files, ncover };
      await ctx.call('errows.character_settings_update_ops', { cid, body });
      ctx.meta.$statusCode = 204;
    }
  },

  /**
   * LLM 调试：返回最近发送给 LLM 的请求 body（chat / voice），内存存储，不落库
   */
  llm_debug_payloads: {
    rest: 'GET /llm-debug/payloads',
    async handler() {
      return getPayloads();
    }
  }
};