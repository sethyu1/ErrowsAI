import fs from 'node:fs';
import path from 'node:path';
import { Task } from '@errows/models';
import { taskErrorHandler } from './error.mjs';

const __dirname = new URL('.', import.meta.url).pathname;

export default {
  task_list: {
    async handler(ctx) {
      const { uid } = ctx.meta.user;
      const schema = this.buildSchema();
      const client = this.pool;
      const taskConfigs = await this.readTaskConfigs();

      const tasksProgress = await Task.getUserTasksProgress(
        client, schema, uid
      );

      const tasks = taskConfigs.map(config => {
        const progress = tasksProgress.get(config.id);

        const is_completed = progress?.completed_at ? true : false;
        const is_claimed = progress?.claimed_at ? true : false;
        const progressValue = progress?.progress ?? 0;
        const res = Object.assign({}, config, {
          progress: progressValue,
          is_completed,
          is_claimed,
        });

        if (config.type === 'token') {
          Object.assign(res, { token: config.token });
        } else if (config.type === 'gift') {
          Object.assign(res, { gift: config.gift });
        }

        return res;
      });

      return tasks;
    }
  },

  task_claim: {
    params: {
      task_id: 'string'
    },
    async handler(ctx) {
      const { uid } = ctx.meta.user;
      const { task_id } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      await Task.claimTaskReward(client, schema, uid, task_id)
      .then(() => {}, taskErrorHandler);

      // 获取任务配置，发放奖励
      const taskConfigs = await this.readTaskConfigs();
      const task = taskConfigs.find(t => t.id === task_id) ?? null;

      ctx.meta.$statusCode = 204;
      if (task === null) {
        return;
      }

      if (task.type === 'token') {
        await ctx.call(
          'payment.coins_reward_by_task_completion',
          { uid, task_id, amount: task.token }
        );
      }
    }
  },

  task_daily_login: {
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      // 获取任务配置，找到每日登录任务的ID
      const dailyLoginTask = await this.findTaskConfigByName('daily_login');
      if (!dailyLoginTask) {
        return;
      }

      await Task.recordDailyLogin(client, schema, uid, dailyLoginTask.id);
    }
  },

  task_character_follow: {
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      // 获取任务配置，找到角色关注任务的ID和goal
      const followTask = await this.findTaskConfigByName('character_follow');
      if (!followTask) {
        return;
      }

      const { id, goal } = followTask;
      await Task.recordTaskProgress(client, schema, uid, id, goal);
    }
  },

  // 监听会话消息发送事件，记录聊天任务进度
  task_message_chat: {
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      // 获取任务配置，找到角色聊天任务的ID和goal
      const chatTask = await this.findTaskConfigByName('character_chat');
      if (!chatTask) {
        return;
      }

      const { id, goal } = chatTask;
      await Task.recordTaskProgress(client, schema, uid, id, goal);
    }
  },

  // 记录图片生成任务进度
  task_character_image_gen: {
    async handler(ctx) {
      const { uid } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      // 获取任务配置，找到图片生成任务的ID和goal
      const imageGenTask = await this.findTaskConfigByName('character_image_gen');

      if (!imageGenTask) {
        return;
      }

      const { id, goal } = imageGenTask;
      await Task.recordTaskProgress(client, schema, uid, id, goal);
    }
  },

  // 记录评论任务进度
  task_post_comment: {
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      // 获取任务配置，找到评论任务的ID和goal
      const commentTask = await this.findTaskConfigByName('post_comment');

      if (!commentTask) {
        return;
      }

      const { id, goal } = commentTask;
      await Task.recordTaskProgress(client, schema, uid, id, goal);
    }
  },
};

export const events = {
};

export const methods = {
  async readTaskConfigs() {
    const filePath = path.join(__dirname, '../../static/tasks.json');
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  },

  async findTaskConfigByName(name) {
    const taskConfigs = await this.readTaskConfigs();
    return taskConfigs.find(task => task.name === name);
  }
};