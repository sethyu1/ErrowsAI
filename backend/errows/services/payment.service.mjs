/**
 * 支付服务
 */

import { Pool } from 'pg';
import config from 'config';
import paymentActions, { methods } from './libs/payment.mjs';

export default {
  name: 'payment',
  settings: {
    rest: '/',
    $noVersionPrefix: true
  },

  actions: {
    ...paymentActions,
  },

  methods: {
    ...methods
  },


  /**
   * 服务启动生命周期钩子
   * @async
   * @description
   * 服务启动时创建 PostgreSQL 连接池
   * 连接池配置来自 config.pg
   */
  async started() {
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