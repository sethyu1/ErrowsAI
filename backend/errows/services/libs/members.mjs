import { Member } from '@errows/models';
import { member_events } from './constrains.mjs';

const {
  CHARACTERS_FOLLOWED,
  MEDIA_IMAGES
} = member_events;

const DEFAULT_MEMBER_MESSAGE_QUOTE = {
  free: { basic: null, advanced: null },
  star: { basic: -1, advanced: null },
  luna: { basic: -1, advanced: 3000 },
  galaxy: { basic: -1, advanced: -1 },
};

export default {
  // 获取会员使用统计信息
  member_stats: {
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const stats = await Member.agg_stats(client, schema, uid);
      return stats;
    }
  },

  /**
   * 查询当前会员信息/状态
   * @api {GET} /member/info 查询当前会员信息/状态
   * @apiName GetMemberInfo
   * @apiGroup Member
   *
   * @returns {Promise<MEMBER_INFO>} 会员信息/状态
   */
  member_info: {
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const memberInfo = await Member.info(client, schema, uid);
      const plan = memberInfo.plan;
      const session_message_quotas = DEFAULT_MEMBER_MESSAGE_QUOTE[plan];

      return Object.assign(memberInfo, { session_message_quotas });
    }
  },

  member_update_stats: {
    params: {
      data: {
        type: 'array',
        items: {
          type: 'tuple',
          items: ['string', 'number']
        }
      }
    },
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const { data } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      await Member.update_stats(client, schema, uid, data);
    }
  }
};

export const events = {
  // @TODO 后续逐步弃用 member_update_stats 事件
  // 在 user service 中直接订阅各类事件，更新会员统计数据
  'member_update_stats': {
    params: {
      uid: 'uuid',
      data: {
        type: 'array',
        items: {
          type: 'tuple',
          items: ['string', 'number']
        }
      }
    },
    async handler(ctx) {
      const { uid } = ctx.params;
      const user = { uid };
      const meta = { user };

      await ctx.call('user.member_update_stats', ctx.params, { meta })
      .catch(error => {
        this.logger.error('Error handling member update stats event:', error);
      });
    }
  },

  character_follow_event: {
    async handler(ctx) {
      const data = [[CHARACTERS_FOLLOWED, 1]];
      const params = { data };
      await ctx.call('user.member_update_stats', params)
      .catch(error => {
        this.logger.error('Error handling character follow event:', error);
      });
    }
  },

  character_image_gen_done: {
    async handler(ctx) {
      const data = [[MEDIA_IMAGES, 1]];
      await ctx.call('user.member_update_stats', { data })
      .catch(error => {
        this.logger.error('Error handling character image gen done event:', error);
      });
    }
  }
};