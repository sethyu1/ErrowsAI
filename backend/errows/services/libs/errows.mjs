import config from 'config';
import moleculer from 'moleculer';
import { resolveAIImageUrl, resolveAssetUrl } from './utils.mjs';
import { Character, Media, Post } from '@errows/models';

const { MoleculerClientError } = moleculer.Errors;

export const methods = {
  /**
   * 获取当前数据库 schema
   * @method buildSchema
   * @returns {string} Schema 名称（默认为 'errows'）
   *
   * @description
   * 从配置文件中获取数据库 schema 名称
   */
  buildSchema() {
    return config.scope;
  },

  // 批量查询角色摘要信息
  async lookupCharacter(schema, ids) {
    const characters = await Character.list_by_ids(
      this.pool, schema,
      Array.from(new Set(ids))
    );

    return new Map(
      characters.map(c => [
        c.id,
        {
          id: c.id,
          nickname: c.nickname,
          avatar_url: resolveAIImageUrl(c.avatar_url),
          gender: c.gender,
          voice: c.voice // characters.dialogue.voice
        }
      ])
    );
  },

  // 批量查询用户摘要信息
  async lookupUsers(ctx, ids) {
    const users = await ctx.call(
      'user.list_user_by_ids',
      { ids: Array.from(new Set(ids)) }
    );
    return new Map(users.map(u => [u.id, u]));
  },

  // 批量查询图像资源信息
  async lookupImages(schema, ids) {
    const imageIds = Array.from(new Set(ids));
    const images = await Media.listImages(
      this.pool, schema, imageIds
    );

    return new Map(images.map(i => [
      i.id,
      {
        id: i.id,
        url: resolveAssetUrl(i.url)
      }
    ]));
  },

  // 动态获取 ai 服务配置（文件 + 控制台配置），voiceCall 仅用文件配置
  async getAIServiceConfig(type) {
    const { default: config } = await import('config');
    const { apiKey } = config.ai;
    if (type === 'voiceCall') return Object.assign({ apiKey }, config.ai.voiceCall);
    const { getCachedMerge, getMergedAIConfig, setCachedMerge } = await import('./ai-config.mjs');
    let merged = getCachedMerge();
    if (!merged) {
      const client = await this.pool.connect();
      try {
        merged = await getMergedAIConfig(client, this.buildSchema());
        setCachedMerge(merged);
      } finally {
        client.release();
      }
    }
    return Object.assign({ apiKey }, merged[type]);
  },

  async deductCoinsByImageGen(ctx, image_gen_task_id) {
    return deductCoinsByAction(
      ctx,
      'image_generation',
      image_gen_task_id
    );
  },

  async deductCoinsByTTS(ctx, message_id) {
    return deductCoinsByAction(
      ctx,
      'tts',
      message_id
    );
  },

  async deductCoinsByVideoGen(ctx, video_gen_task_id) {
    return deductCoinsByAction(
      ctx,
      'video_generation',
      video_gen_task_id
    );
  },

  async deductCoinsBySpeedUp(ctx, task_id) {
    return deductCoinsByAction(
      ctx,
      'speed_up',
      task_id
    );
  },

  async deductCoins(ctx, amount, resource_id) {
    return ctx.call(
      'payment.deduction_coins',
      { amount, resource_id },
      ctx.meta,
    );
  },
};

async function deductCoinsByAction(ctx, action, resource_id) {
  return ctx.call(
    'payment.deduction_coins_by_action',
    { action, resource_id },
    ctx.meta,
  );
}

export const events = {
  // 监听用户 profile 事件，记录每日登录
  user_profile_event: {
    async handler(ctx) {
      await ctx.call('errows.task_daily_login', ctx.params, { meta: ctx.meta })
      .catch(err => {
        this.logger.error('Error recording daily login task progress:', err);
      });
    }
  },

  // 监听用户初始化事件，创建默认 persona
  user_initialized: {
    params: {
      uid: 'uuid',
      name: 'string'
    },
    async handler(ctx) {
      const { uid, name } = ctx.params;
      await ctx.call(
        'errows.session_persona_create',
        { body: { uid, name } },
        { meta: { user: { uid } } }
      )
      .catch(err => {
        this.logger.error('Error creating default persona for user:', err);
      });
    }
  },

  'user_account_deleted': {
    params: { uid: 'uuid' },
    async handler(ctx) {
      const { uid } = ctx.params;
      const client = this.pool;
      const schema = this.buildSchema();
      await Character.deleteByOwnerId(client, schema, uid);
      await Post.deleteByOwnerId(client, schema, uid);
    }
  }
};