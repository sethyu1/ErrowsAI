/**
 * @fileoverview Errows 核心服务
 * @module services/errows
 * @description 提供角色、帖子、会话相关的核心业务逻辑和事件处理
 * 作为主要的业务服务，整合了 characters、posts、sessions 等功能模块
 * 负责处理 AI 生成任务的事件响应和数据库操作
 */

import os from 'node:os';
import path from 'node:path';
import _ from 'lodash';
import config from 'config';
import { Pool } from 'pg';
import {
  methods as errowsMethods,
  events as errowsEvents
} from './libs/errows.mjs';
import { ensureDir } from './libs/utils.mjs';
import { getMergedAIConfig, setCachedMerge } from './libs/ai-config.mjs';
import characterActions, { events as characterEvents } from './libs/characters.mjs';
import mediaActions, { events as mediaEvents } from './libs/media.mjs';
import postActions, { events as postEvents } from './libs/posts.mjs';
import sessionActions, { methods as sessionMethods } from './libs/sessions.mjs';
import characterRefineActions from './libs/character-refine.mjs';
import tasksActions, {
  methods as taskMethods, events as taskEvents
} from './libs/task.mjs';
import { registerMetrics, methods as metricsMethods } from './libs/metrics.mjs';
import notionActions from './libs/notion.mjs';
import agoraActions from './libs/agora.mjs';


/**
 * Errows 核心服务定义
 * @type {import('moleculer').ServiceSchema}
 */
export default {
  name: 'errows',
  settings: {
    rest: '/',
    $noVersionPrefix: true
  },

  events: {
    ...characterEvents,
    ...mediaEvents,
    ...postEvents,
    ...errowsEvents,
    ...taskEvents
  },

  actions: {
    ...characterActions,
    ...mediaActions,
    ...postActions,
    ...sessionActions,
    ...characterRefineActions,
    ...agoraActions,
    ...tasksActions,
    ...notionActions,
  },

  methods: {
    ...errowsMethods,
    ...taskMethods,
    ...metricsMethods,
    ...sessionMethods
  },

  created() {
    registerMetrics(this.broker);
  },

  async started() {
    this.temp_dir = path.join(os.tmpdir(), 'errows_temp');
    this.upload_dir = config.assets.uploadPath;
    this.session_dir = path.join(this.upload_dir, 'sessions');
    await ensureDir(this.temp_dir);
    await ensureDir(this.upload_dir);
    await ensureDir(this.session_dir);
    this.pool = new Pool(config.pg);
    const client = await this.pool.connect();
    try {
      const merged = await getMergedAIConfig(client, config.scope);
      setCachedMerge(merged);
    } finally {
      client.release();
    }
  },

  async stopped() {
    await this.pool.end();
  }
};

