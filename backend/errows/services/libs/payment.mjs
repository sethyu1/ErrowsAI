import _ from 'lodash';
import config from 'config';
import { randomUUID } from 'crypto';
import { Member, Payment, Configuration } from '@errows/models';
import { addDays } from 'date-fns';
import { payment_transition_reasons } from './constrains.mjs';
import { paymentErrorHandler } from './error.mjs';
import stripe, {
  createPaymentSession, createSubscriptionSession,
  createCustomerPortalSession
} from './stripe.mjs';
import { handleStripeWebhook } from './stripe_webhook.mjs';
import { Errors } from 'moleculer';
const { MoleculerClientError } = Errors;

const actionValidator = {
  type: 'string',
  enum: ['tts', 'image_generation', 'video_generation', 'speed_up']
};

export default {
  // @description 创建 CD-Key（one-time 或 multiple）；display_key 可选 8-30 位
  cdkey_create: {
    params: {
      display_key: { type: 'string', optional: true, min: 8, max: 30 },
      usage_type: { type: 'string', enum: ['one_time', 'multiple'], optional: true, default: 'one_time' },
      max_redemptions: { type: 'number', optional: true, min: 1 },
      plan: { type: 'string', enum: ['free', 'star', 'luna', 'galaxy'], optional: true, default: 'free' },
      key: { type: 'string', optional: true },
      coin_amount: { type: 'number', optional: true, default: 100 },
      count: { type: 'number', optional: true, default: 1, min: 1, max: 100 },
      valid_from: { type: 'string', optional: true },
      valid_to: { type: 'string', optional: true },
      benefit_plan: { type: 'string', enum: ['free', 'star', 'luna', 'galaxy'], optional: true },
      benefit_plan_start_days: { type: 'number', optional: true },
      benefit_plan_end_days: { type: 'number', optional: true },
      benefit_plan_valid_from: { type: 'string', optional: true },
      benefit_plan_valid_to: { type: 'string', optional: true },
      benefit_coin_gold: { type: 'number', optional: true, default: 0 },
      benefit_coin_free: { type: 'number', optional: true },
    },
    async handler(ctx) {
      const {
        display_key, usage_type = 'one_time', max_redemptions,
        plan = 'free', key,
        coin_amount, count = 1,
        valid_from, valid_to,
        benefit_plan, benefit_plan_start_days, benefit_plan_end_days,
        benefit_plan_valid_from, benefit_plan_valid_to,
        benefit_coin_gold = 0, benefit_coin_free,
      } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const createOne = (opts) => Payment.createCDKey(client, schema, uid, {
        ...opts,
        display_key: display_key ?? null,
        usage_type,
        max_redemptions: usage_type === 'multiple' ? (max_redemptions ?? 1) : null,
        key: key && count === 1 ? key : null,
        plan,
        coin_amount,
        valid_from: valid_from ? new Date(valid_from) : undefined,
        valid_to: valid_to ? new Date(valid_to) : undefined,
        benefit_plan: benefit_plan ?? undefined,
        benefit_plan_start_days: benefit_plan_start_days ?? undefined,
        benefit_plan_end_days: benefit_plan_end_days ?? undefined,
        benefit_plan_valid_from: benefit_plan_valid_from ? new Date(benefit_plan_valid_from) : null,
        benefit_plan_valid_to: benefit_plan_valid_to ? new Date(benefit_plan_valid_to) : null,
        benefit_coin_gold,
        benefit_coin_free: benefit_coin_free ?? coin_amount,
      });

      if (usage_type === 'multiple') {
        const res = await createOne({});
        return res;
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        results.push(await createOne({}));
      }
      return count === 1 ? results[0] : results;
    }
  },

  /** @description 列出 CD-Key（分页、按 plan / usage_type / 是否已兑换筛选） */
  cdkey_list: {
    params: {
      page: { type: 'number', optional: true, default: 1, convert: true },
      pageSize: { type: 'number', optional: true, default: 20, convert: true },
      plan: { type: 'string', optional: true },
      redeemed: { type: 'string', optional: true },
      usage_type: { type: 'string', enum: ['one_time', 'multiple'], optional: true },
    },
    async handler(ctx) {
      const { page, pageSize, plan, redeemed: redeemedParam, usage_type } = ctx.params;
      const redeemed = redeemedParam === 'true'
        ? true
        : redeemedParam === 'false'
          ? false
          : undefined;
      const schema = this.buildSchema();
      const client = this.pool;
      return Payment.listCDKeys(client, schema, { page, pageSize, plan, redeemed, usage_type });
    }
  },

  /** @description 删除未兑换的 CD-Key */
  cdkey_delete: {
    params: { id: 'uuid' },
    async handler(ctx) {
      const { id } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;
      const deleted = await Payment.deleteCDKey(client, schema, id);
      if (!deleted) {
        throw new MoleculerClientError(
          'CD-Key not found or already redeemed',
          404,
          'CDKEY_NOT_FOUND_OR_REDEEMED'
        );
      }
      ctx.meta.$statusCode = 204;
    }
  },

  /** @description 更新 CD-Key（display_key 8-30 位、有效期与权益） */
  cdkey_update: {
    params: {
      id: 'uuid',
      display_key: { type: 'string', optional: true, min: 8, max: 30 },
      valid_from: { type: 'string', optional: true },
      valid_to: { type: 'string', optional: true },
      benefit_plan: { type: 'string', optional: true },
      benefit_plan_start_days: { type: 'number', optional: true },
      benefit_plan_end_days: { type: 'number', optional: true },
      benefit_plan_valid_from: { type: 'string', optional: true },
      benefit_plan_valid_to: { type: 'string', optional: true },
      benefit_coin_gold: { type: 'number', optional: true },
      benefit_coin_free: { type: 'number', optional: true },
      max_redemptions: { type: 'number', optional: true, min: 1 },
    },
    async handler(ctx) {
      const { id, display_key, valid_from, valid_to, benefit_plan, benefit_plan_start_days, benefit_plan_end_days, benefit_plan_valid_from, benefit_plan_valid_to, benefit_coin_gold, benefit_coin_free, max_redemptions } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;
      const updates = {};
      if (display_key !== undefined) updates.display_key = display_key === '' ? null : display_key;
      if (valid_from != null && valid_from !== '') updates.valid_from = new Date(valid_from);
      if (valid_to != null && valid_to !== '') updates.valid_to = new Date(valid_to);
      if (benefit_plan !== undefined) updates.benefit_plan = (benefit_plan && ['free', 'star', 'luna', 'galaxy'].includes(benefit_plan)) ? benefit_plan : null;
      if (benefit_plan_start_days !== undefined) updates.benefit_plan_start_days = benefit_plan_start_days;
      if (benefit_plan_end_days !== undefined) updates.benefit_plan_end_days = benefit_plan_end_days;
      if (benefit_plan_valid_from != null && benefit_plan_valid_from !== '') updates.benefit_plan_valid_from = new Date(benefit_plan_valid_from);
      if (benefit_plan_valid_to != null && benefit_plan_valid_to !== '') updates.benefit_plan_valid_to = new Date(benefit_plan_valid_to);
      if (benefit_coin_gold !== undefined) updates.benefit_coin_gold = benefit_coin_gold;
      if (benefit_coin_free !== undefined) updates.benefit_coin_free = benefit_coin_free;
      if (max_redemptions !== undefined) updates.max_redemptions = max_redemptions;
      const updated = await Payment.updateCDKey(client, schema, id, updates);
      if (!updated) {
        throw new MoleculerClientError(
          'CD-Key not found or already redeemed',
          404,
          'CDKEY_NOT_FOUND_OR_REDEEMED'
        );
      }
      ctx.meta.$statusCode = 204;
    }
  },

  /**
   * @description 兑换 CD-Key
   * @param {string} key CD-Key 码（8 位 display_key 或旧 UUID）
   * @returns {Object} 包含兑换结果信息
   */
  cdkey_redeem: {
    rest: 'POST /cdkey/redeem',
    params: {
      key: 'string',
    },
    async handler(ctx) {
      const { key } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      const client = await this.pool.connect();
      await client.query('BEGIN');
      try {
        const cdkey = await Payment.redeemCDKey(client, schema, uid, key);
        const {
          id,
          benefit_plan,
          benefit_plan_start_days,
          benefit_plan_end_days,
          benefit_plan_valid_from,
          benefit_plan_valid_to,
          benefit_coin_gold,
          benefit_coin_free,
        } = cdkey;

        const now = new Date();
        // Subscription period: use benefit time range when set; else days (default 30 for end)
        const hasPlanTimeRange = benefit_plan_valid_from != null && benefit_plan_valid_to != null;
        const planStart = hasPlanTimeRange
          ? new Date(benefit_plan_valid_from)
          : addDays(now, benefit_plan_start_days ?? 0);
        const planEnd = hasPlanTimeRange
          ? new Date(benefit_plan_valid_to)
          : addDays(now, benefit_plan_end_days ?? 30);
        const freeCoinAmount = benefit_coin_free ?? 0;
        const goldCoinAmount = benefit_coin_gold ?? 0;

        // 1. Free coins only, or free + others: cap at 100 total free balance
        let actualFreeAdded = 0;
        if (freeCoinAmount > 0) {
          const actualFreeAmount = await this.calculateCappedFreeCoins(client, schema, uid, freeCoinAmount);
          actualFreeAdded = actualFreeAmount;
          if (actualFreeAmount > 0) {
            await Payment.addCoinTransaction(
              client, schema, uid,
              id, actualFreeAmount,
              payment_transition_reasons.CDKEY_REDEEM,
            );
            let freeCoinsValidTo = hasPlanTimeRange
              ? new Date(benefit_plan_valid_to)
              : addDays(now, benefit_plan_end_days ?? 30);
            // Balance only counts rows where stv_tr @> NOW(); valid_to must be strictly after now
            if (!freeCoinsValidTo || freeCoinsValidTo <= now) {
              freeCoinsValidTo = addDays(now, 30);
            }
            await Payment.topUpFreeCoins(
              client, schema, uid,
              actualFreeAmount, now, freeCoinsValidTo
            );
          }
        }

        // 2. Gold coins only, or gold + others
        if (goldCoinAmount > 0) {
          await Payment.topUpGoldCoinsForCdKey(client, schema, uid, id, goldCoinAmount);
        }

        // 3 & 4. Subscription benefit (alone or with coins): apply when plan is not free
        const plan = benefit_plan ?? cdkey.plan;
        if (plan && plan !== 'free') {
          await Payment.upgradePlanWithCdKey(
            client, schema, uid,
            plan,
            planEnd,
            id,
            planStart
          );
        }

        await client.query('COMMIT');

        // Single user-facing message: what was granted (free coins, gold coins, membership)
        const parts = [];
        if (actualFreeAdded > 0) parts.push(`${actualFreeAdded} free coins`);
        if (goldCoinAmount > 0) parts.push(`${goldCoinAmount} gold coins`);
        if (plan && plan !== 'free') {
          const planLabel = { star: 'Star', luna: 'Luna', galaxy: 'Galaxy' }[plan] || plan;
          const endStr = planEnd ? planEnd.toISOString().slice(0, 10) : '';
          parts.push(`${planLabel} membership${endStr ? ` until ${endStr}` : ''}`);
        }
        const message = parts.length ? `You received: ${parts.join(', ')}` : 'Redeemed successfully';

        return {
          id,
          plan,
          benefit_coin_gold: goldCoinAmount,
          benefit_coin_free: freeCoinAmount,
          benefit_coin_free_actual: actualFreeAdded,
          plan_start: planStart,
          plan_end: planEnd,
          message,
        };
      } catch (err) {
        await client.query('ROLLBACK');
        paymentErrorHandler(err);
      } finally {
        client.release();
      }
    }
  },

  // 获取免费费用币初始余额（从 configurations 读取，fallback config）
  async coin_balance_init() {
    const schema = this.buildSchema();
    const client = await this.pool.connect();
    try {
      const v = await Configuration.getConfiguration(client, schema, 'member', 'coin_free_balance');
      const n = v != null && Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : null;
      return { coin_free_balance: n ?? config.member?.coin_free_balance ?? 50 };
    } finally {
      client.release();
    }
  },

  // 语音通话最低币数（从 configurations 读取，fallback 60）
  get_voice_call_min_coins: {
    async handler() {
      const schema = this.buildSchema();
      const client = await this.pool.connect();
      try {
        const v = await Configuration.getConfiguration(client, schema, 'payment', 'voice_call_min_coins');
        const n = v != null && Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : null;
        return n ?? 60;
      } finally {
        client.release();
      }
    }
  },

  // 任务完成奖励代币
  coins_reward_by_task_completion: {
    params: {
      task_id: 'uuid',
      amount: 'number'
    },
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const { task_id, amount } = ctx.params;
      const schema = this.buildSchema();
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        // 计算可添加的免费币数量（不超过100上限）
        const actualAmount = await this.calculateCappedFreeCoins(client, schema, uid, amount);

        if (actualAmount > 0) {
          // 记录交易
          await Payment.addCoinTransaction(
            client, schema, uid,
            task_id, actualAmount,
            payment_transition_reasons.TASK_COMPLETION
          );

          // 增加免费代币
          const valid_from = new Date();
          const valid_to = 'infinity';
          await Payment.topUpFreeCoins(
            client, schema, uid, actualAmount, valid_from, valid_to
          );
        }

        await client.query('COMMIT');
        ctx.meta.$statusCode = 204;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  },

  // 查询价格列表（从 DB 加载并缓存）
  prices: {
    async handler(ctx) {
      const schema = this.buildSchema();
      const client = await this.pool.connect();
      try {
        await Payment.loadPricesOnce(client, schema);
        return Payment.listPrices();
      } finally {
        client.release();
      }
    }
  },

  // 更新模型消耗配置（coins charged）
  prices_update: {
    params: {
      prices: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            action: { type: 'string' },
            amount: { type: 'number', minimum: 0 },
            description: { type: 'string', optional: true },
            unit: { type: 'string', optional: true },
          }
        }
      }
    },
    async handler(ctx) {
      const { prices } = ctx.params;
      const schema = this.buildSchema();
      const client = await this.pool.connect();
      try {
        const updated = await Payment.savePrices(client, schema, prices);
        return updated;
      } finally {
        client.release();
      }
    }
  },

  // 更新/创建代币产品列表
  coin_products_upsert: {
    params: {
      products: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', optional: true, default: null },
            title: 'string',
            amount: 'number',
            price_id: 'string',
            price: 'number',
            discount_rate: 'number',
            before_discount_price: 'number',
          }
        }
      }
    },
    async handler(ctx) {
      const { products } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      await Payment.upsertCoinProducts(client, schema, products);

      ctx.meta.$statusCode = 204;
    }
  },

  // 获取代币产品列表
  coin_products_list: {
    rest: 'GET /coins',
    async handler() {
      const schema = this.buildSchema();
      const client = this.pool;

      const products = await Payment.listCoinProducts(client, schema);
      return products;
    }
  },

  // 代币产品结账
  coin_product_checkout: {
    rest: 'POST /coins/:pid/checkout',
    params: {
      pid: 'uuid'
    },
    async handler(ctx) {
      const { pid } = ctx.params;
      const { uid, email } = ctx.meta.user;
      const schema = this.buildSchema();
      const client = this.pool;

      const product = await Payment
        .getCoinProductById(client, schema, pid)
        .then(res => res, paymentErrorHandler);
      const { price_id } = product;

      const payment_id = randomUUID();

      // 保存购买记录
      const success_url = this.getSuccessUrl(ctx);
      const session = await createPaymentSession(
        price_id, email, { success_url });
      const { id: session_id, url: checkout_url } = session;
      await Payment.createPurchase(
        client, schema, payment_id, uid, pid, session_id
      );

      ctx.call('user.pixel_checkout', { payment_id, uid, product })
        .catch(err => {
          this.logger.error('Error during pixel checkout tracking:', err);
        });
      ctx.call('user.reddit_checkout', { payment_id, uid, product })
        .catch(err => {
          this.logger.error('Error during Reddit checkout tracking:', err);
        });

      return { id: payment_id, session_id, checkout_url };
    }
  },

  // 更新/创建订阅产品列表
  subscription_products_upsert: {
    params: {
      type: { type: 'string', enum: ['monthly', 'yearly'] },
      products: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', enum: ['star', 'luna', 'galaxy'] },
            title: 'string',
            price_id: 'string',
            price: 'number',
            discount_rate: 'number',
            before_discount_price: 'number',
            bonus_coin: 'number',
            bonus_date: 'number',
            bonus_time: 'number',
            value: 'string',
            rights: 'string',
          }
        }
      }
    },
    async handler(ctx) {
      const { type, products } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      await Payment.upsertSubscriptionProducts(client, schema, type, products);

      ctx.meta.$statusCode = 204;
    }
  },

  // 获取订阅套餐列表
  subscription_products_list: {
    rest: 'GET /subscriptions',
    async handler() {
      const schema = this.buildSchema();
      const client = this.pool;

      const products = await Payment.listSubscriptionProducts(client, schema);
      return products;
    }
  },

  // 订阅产品结账
  subscription_product_checkout: {
    rest: 'POST /subscriptions/:pid/checkout',
    params: {
      pid: 'uuid'
    },
    async handler(ctx) {
      const { pid } = ctx.params;
      const { uid, email } = ctx.meta.user;
      const schema = this.buildSchema();
      const client = this.pool;

      const product = await Payment
        .getSubscriptionProductById(client, schema, pid)
        .then(res => res, paymentErrorHandler);
      const { price_id } = product;

      const payment_id = randomUUID();

      // 保存购买记录
      const success_url = this.getSuccessUrl(ctx);
      const session = await createSubscriptionSession(price_id, email, { success_url });
      const { id: session_id, url: checkout_url } = session;
      await Payment.createPurchase(
        client, schema, payment_id, uid, pid, session_id
      );

      ctx.call('user.pixel_checkout', { payment_id, uid, product })
        .catch(err => {
          this.logger.error('Error during pixel checkout tracking:', err);
        });
      ctx.call('user.reddit_checkout', { payment_id, uid, product })
        .catch(err => {
          this.logger.error('Error during Reddit checkout tracking:', err);
        });

      return { id: payment_id, session_id, checkout_url };
    }
  },

  // 创建订阅管理门户会话（用于升级/取消订阅）
  subscription_portal: {
    rest: 'POST /subscriptions/portal',
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      // Get user's subscription_id from members_plan
      const { rows: [planRow] } = await client.query(
        `SELECT subscription_id FROM ${schema}.members_plan
         WHERE id = $1 AND stv_tr @> NOW() AND subscription_id IS NOT NULL
         ORDER BY created_at DESC LIMIT 1`,
        [uid]
      );

      if (!planRow?.subscription_id) {
        throw new MoleculerClientError(
          'No active subscription found',
          404,
          'NO_ACTIVE_SUBSCRIPTION'
        );
      }

      // Get subscription from Stripe to find customer_id
      const subscription = await stripe.subscriptions.retrieve(planRow.subscription_id);
      const customerId = subscription.customer;

      // Create portal session
      const returnUrl = this.getSuccessUrl(ctx);
      const portalSession = await createCustomerPortalSession(customerId, returnUrl);

      return { url: portalSession.url };
    }
  },

  // 检查购买状态
  purchase_status: {
    rest: 'GET /:purchase_id/status',
    params: {
      purchase_id: 'uuid'
    },
    async handler(ctx) {
      const { purchase_id } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      const status = await Payment
        .getPurchaseStatus(client, schema, purchase_id)
        .then(res => res, paymentErrorHandler);

      return status;
    }
  },

  stripe_webhook: {
    async handler(ctx) {
      return handleStripeWebhook(ctx, this);
    }
  },

  // 根据用户操作扣除费用币
  deduction_coins_by_action: {
    params: {
      action: actionValidator,
      resource_id: 'uuid'
    },
    async handler(ctx) {
      const { action, resource_id } = ctx.params;
      const reason = ctx.options.parentCtx?.action.name ?? action;
      const schema = this.buildSchema();
      const client = await this.pool.connect();
      try {
        await Payment.loadPricesOnce(client, schema);
        const amount = Payment.getPriceByAction(action);
        return await ctx.call(
          'payment.deduction_coins',
          { amount, reason, resource_id }
        );
      } finally {
        client.release();
      }
    }
  },

  // 根据用户操作扣除费用币
  deduction_coins: {
    params: {
      amount: 'number',
      reason: { type: 'string', optional: true },
      resource_id: 'uuid',
    },
    async handler(ctx) {
      const { amount, resource_id } = ctx.params;
      const reason = ctx.params.reason ?? ctx.options.parentCtx?.action.name ?? 'deduction';

      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const deductRes = await Payment.deductCoinsByAction(
          client, schema, uid,
          amount, resource_id,
          reason
        )
          .then(res => res, paymentErrorHandler);
        const deducted_amount = deductRes.free + deductRes.purchased;

        const res = await Payment.addCoinTransaction(
          client, schema, uid, resource_id,
          -deducted_amount, reason
        );
        await client.query('COMMIT');
        return res;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        await client.release();
      }
    }
  },

  refound_by_transition: {
    params: {
      transaction_id: 'uuid',
      resource_id: 'uuid',
      reason: { type: 'string', optional: true }
    },
    async handler(ctx) {
      const reason = ctx.params.reason
        ?? ctx.options.parentCtx.action?.name
        ?? ctx.options.parentCtx.event?.name;

      const { transaction_id, resource_id } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      await Payment.refoundByTransition(
        client, schema, uid,
        transaction_id, resource_id, reason
      )
        .then(res => res, paymentErrorHandler);
    }
  },

  list_coin_transactions: {
    params: {
      uid: 'uuid',
    },
    async handler(ctx) {
      const { uid } = ctx.params;
      const schema = this.buildSchema();
      const client = this.pool;

      const transactions = await Payment.listCoinTransactions(
        client, schema, uid
      );

      return transactions;
    }
  },
};

export const methods = {
  buildSchema() {
    return config.scope;
  },
  // Build success URL from request domain (referrer / origin) for multi-domain support
  getSuccessUrl(ctx) {
    const fallback = config.host?.origin
      ? `${config.host.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`
      : config.stripe?.successUrl;
    let origin = null;
    const referrer = ctx?.meta?.referrer ?? null;
    if (referrer) {
      try {
        origin = new URL(referrer).origin;
      } catch (_err) {}
    }
    if (!origin) {
      origin = ctx?.meta?.requestOrigin ?? null;
    }
    if (origin) {
      return `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    }
    return fallback;
  },
  async getUserProfile(ctx, uid) {
    return ctx.call('user.profile', { uid }, { meta: ctx.meta });
  },

  // 计算可添加的免费币数量（不超过 max_free_coins 上限，从 configurations 读取，fallback 100）
  async calculateCappedFreeCoins(client, schema, uid, requestedAmount) {
    const memberInfo = await Member.info(client, schema, uid);
    const currentFreeBalance = memberInfo.coin_free_balance || 0;
    const v = await Configuration.getConfiguration(client, schema, 'payment', 'max_free_coins');
    const maxFreeCoins = (v != null && Number.isFinite(Number(v)) ? Math.max(0, Math.floor(Number(v))) : null) ?? 100;
    const availableSlots = Math.max(0, maxFreeCoins - currentFreeBalance);
    return Math.min(requestedAmount, availableSlots);
  },
};