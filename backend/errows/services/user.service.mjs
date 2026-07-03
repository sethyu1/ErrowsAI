/**
 * @fileoverview 用户服务
 * @module services/user
 * @description 提供用户注册、登录、邮箱验证、个人资料管理等核心用户功能
 * 包含用户认证、邮件发送、验证码生成等功能
 */
import path from 'node:path';
import os from 'node:os';
import { Pool } from 'pg';
import config from 'config';
import { ensureDir } from './libs/utils.mjs';
import userActions from './libs/users.mjs';
import memberActions, { events as memberEvents } from './libs/members.mjs';
import pixelActions, { methods as pixelMethods } from './libs/pixel.mjs';

/**
 * 用户服务定义
 * @type {import('moleculer').ServiceSchema}
 */
export default {
  name: 'user',
  settings: {
    rest: '/',
    $noVersionPrefix: true
  },

  events: {
    ...memberEvents,
  },

  actions: {
    ...userActions,
    ...memberActions,
    ...pixelActions,
  },

  methods: {
    /**
     * 获取当前数据库 schema
     * @method buildSchema
     * @returns {string} Schema 名称（默认为 'errows'）
     *
     * @description
     * 从配置文件中获取数据库 schema 名称
     * 用于支持多租户或多环境部署
     */
    buildSchema() {
      return config.scope;
    },

    /**
     * 生成 6 位数字验证码
     * @method genVerifyCode
     * @returns {string} 6 位数字字符串（不足 6 位时前面补 0）
     *
     * @description
     * 使用随机数生成 6 位验证码
     * 范围: 000000 ~ 999999
     *
     * @example
     * const code = this.genVerifyCode();
     * // 可能返回: '314159' 或 '000042'
     */
    genVerifyCode() {
      return Math.floor(Math.random() * 999999).toString().padEnd(6, '0');
    },

    ...pixelMethods
  },

  /**
   * 服务启动生命周期钩子
   * @async
   * @description
   * 服务启动时创建 PostgreSQL 连接池
   * 连接池配置来自 config.pg
   */
  async started() {
    this.temp_dir = path.join(os.tmpdir(), 'errows_temp');
    this.avatar_dir = path.join(config.assets.uploadPath, 'avatars');
    await ensureDir(this.avatar_dir);
    this.pool = new Pool(config.pg);
  },

  /**
   * 服务停止生命周期钩子
   * @async
   * @description
   * 服务停止时关闭数据库连接池
   * 释放所有数据库连接
   */
  async stopped() {
    await this.pool.end();
  }
};