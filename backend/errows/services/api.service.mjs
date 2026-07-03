/**
 * @fileoverview API 网关服务
 * @module services/api
 * @description 提供 HTTP API 路由、认证、授权和响应格式化功能
 * 作为所有 HTTP 请求的入口点，处理 JWT 认证和路由分发
 */

import Stream from 'node:stream';
import config from 'config';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import APIService from 'moleculer-web';
import * as DateFns from 'date-fns';

const {
  UnAuthorizedError, ForbiddenError,
  ERR_NO_TOKEN, ERR_INVALID_TOKEN
} = APIService.Errors;

/**
 * 签发 JWT Token
 * @function signToken
 * @param {Object} payload - Token 载荷数据
 * @param {string} payload.uid - 用户 ID (必需)
 * @param {string} [payload.scope] - 访问范围，用于限制 token 只能访问特定接口
 * @param {string} [tokenExpiresIn] - 过期时间（可选，默认使用配置中的 7d）
 * @returns {{token: string}} 包含 JWT token 的对象
 *
 * @description
 * 使用 jsonwebtoken 库签发 JWT token
 * Token 包含用户 ID 和可选的访问范围
 * 默认过期时间为 7 天
 *
 * @example
 * const { token } = signToken({ uid: 'user-123' });
 * // 返回: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
 *
 * @example
 * // 带访问范围的 token（仅能访问特定接口）
 * const { token } = signToken({ uid: 'user-123', scope: 'errows.post_get' }, '1h');
 */
export function signToken(payload, tokenExpiresIn) {
  const options = Object.assign(
    {}, config.jwt.options,
    tokenExpiresIn ? { expiresIn: tokenExpiresIn } : {}
  );

  const tokenPayload = _.cloneDeep(payload);
  const token = jwt.sign(tokenPayload, config.jwt.secret, options);
  return { token };
}

/**
 * API 请求后置处理函数
 *
 * @description
 * 在 Action 执行完成后调用，用于：
 * 1. 统一响应格式：{ code: 0, message: 'ok', data: {...} }
 * 2. 如果 data 中包含 token 对象，自动签发 JWT
 *
 */
async function onAfterCall(ctx, route, req, res, data = {}) {
  if (data instanceof Stream.Readable) {
    return data;
  }

  if (Object.hasOwnProperty.call(data, 'token')) {
    const { token } = signToken(data.token);
    Object.assign(data, { token });
  }

  return { code: 0, message: 'ok', data };
}

/**
 * API 请求前置处理函数
 * @function onBeforeCall
 *
 * @description
 * 在 Action 执行前调用，用于提取请求元信息（IP 地址和 User-Agent）
 */
function onBeforeCall(ctx, route, req, _res) {
  // 提取客户端 IP 地址
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || req.connection?.remoteAddress;

  // 提取 User-Agent
  const userAgent = req.headers['user-agent'] || null;
  const referrer = req.headers['referer'] || null;
  // 请求来源域名（用于多域名场景：支付成功跳转等）
  let requestOrigin = req.headers['origin'] || null;
  if (!requestOrigin && referrer) {
    try {
      requestOrigin = new URL(referrer).origin;
    } catch (_e) {}
  }

  // 将这些信息附加到 meta 中，供 action 使用
  ctx.meta.ipAddress = ipAddress;
  ctx.meta.userAgent = userAgent;
  ctx.meta.referrer = referrer;
  ctx.meta.requestOrigin = requestOrigin;

  const url = req.url ?? '';
  if (req.method === 'GET' && (url.startsWith('/characters') || url.startsWith('/ops/characters'))) {
    delete req.headers['if-none-match'];
    delete req.headers['if-modified-since'];
  }
}

function routeConfig(path, actions, overrides = {}) {
  return Object.assign(
    {
      authentication: true,
      authorization: true,
      autoAliases: false,
      mappingPolicy: 'restrict',
      bodyParser: { json: true, urlencoded: false },
      onBeforeCall,
      onAfterCall,
    },
    overrides,
    { path, whitelist: [].concat(actions) }
  );
}

/**
 * API 路由配置
 * @constant
 * @type {Array<Object>}
 *
 * @description
 * 定义所有 HTTP API 的路由、认证和授权规则
 */
const routes = [
  routeConfig(
    '/',
    [
      '$node.*', 'api.*',

      'user.register',
      'user.send_verification_code',
      'user.send_mobile_verification_code',
      'user.mobile_register',
      'user.email_verify',
      'user.login',
      'user.mobile_login',
      'user.password_forgot',
      'user.mobile_password_forgot',
      'user.google_oauth',

      'errows.character_list',
      'errows.character_creation_options',
      'errows.character_image_gen_options',
      'errows.character_get',

      'errows.post_list',
      'errows.post_get',

      'errows.notion_blog_list',
      'errows.notion_blog_get',

      'ops.support_create',
      'ops.configuration_legal_terms_get',
      'ops.configuration_home_display_get',
    ],
    {
      authorization: false,
      aliases: {
        'GET  /services': '$node.services',
        'GET  /nodes':    '$node.list',
        'GET  /aliases':  'api.listAliases',

        'POST /user/register':            'user.register',
        'POST /user/send_verification_code': 'user.send_verification_code',
        'POST /user/send_mobile_verification_code': 'user.send_mobile_verification_code',
        'POST /user/mobile_register':     'user.mobile_register',
        'POST /user/verify':              'user.email_verify',
        'POST /user/password/forgot':     'user.password_forgot',
        'POST /user/mobile_password/forgot': 'user.mobile_password_forgot',
        'POST /user/login':               'user.login',
        'POST /user/mobile_login':        'user.mobile_login',
        'POST /user/login/google':        'user.google_oauth',

        'GET    /characters/': 'errows.character_list',
        'GET    /characters/options': 'errows.character_creation_options',
        'GET    /characters/images/options': 'errows.character_image_gen_options',
        'GET    /characters/:cid': 'errows.character_get',

        'GET    /posts/:pid': 'errows.post_get',
        'GET    /posts/': 'errows.post_list',

        'GET    /notion/blog/:pageId': 'errows.notion_blog_get',
        'GET    /notion/blog': 'errows.notion_blog_list',

        'POST   /supports': 'ops.support_create',
        'GET    /legal': 'ops.configuration_legal_terms_get',
        'GET    /config/home-display': 'ops.configuration_home_display_get',
      },
    }
  ),
  routeConfig('/user', 'user.*', {
    autoAliases: true,
    aliases: {
      'POST   /avatar':     'stream:user.avatar_upload',
    }
  }),
  routeConfig('/my', 'errows.*', {
    mergeParams: false,
    aliases: {
      'POST   /character/refine': 'errows.refine_character_text',
    }
  }),
  routeConfig('/my/characters', 'errows.*', {
    mergeParams: false,
    aliases: {
      'POST   /':               'errows.character_create',
      'GET    /:cid/settings':  'errows.character_settings_get',
      'PUT    /:cid/settings':  'errows.character_settings_update',
      'POST   /:cid/avatar':    'errows.character_avatar_gen',
      'DELETE /:cid':           'errows.character_delete',
      'GET    /:type':          'errows.character_list_my',

      'POST   /:cid/post/images': 'stream:errows.post_image_upload',
      'POST   /:cid/posts':       'errows.post_create',
      'DELETE /:cid/posts/:pid':  'errows.post_delete',

      'GET    /images':         'errows.character_image_list_stats',
      'GET    /videos':         'errows.character_video_list_stats',
      'GET    /:cid/images':    'errows.character_image_list_by_character',
      'GET    /:cid/videos':    'errows.character_video_list_by_character',
      'DELETE /:cid/images/:aid': 'errows.character_image_delete',
      'DELETE /:cid/videos/:vid': 'errows.character_video_delete',
    }
  }),
  routeConfig('/characters/:cid', 'errows.*', {
    aliases: {
      'POST    /like': 'errows.character_like',
      'DELETE  /like': 'errows.character_unlike',
      'POST    /follow': 'errows.character_follow',
      'DELETE  /follow': 'errows.character_unfollow',

      'POST    /images/tasks':              'errows.character_image_gen_task_create',
      'POST    /images/tasks/:tid/retry':  'errows.character_image_gen_task_retry',
      'GET     /images/tasks/:tid':         'errows.character_image_gen_task_get',
      'GET     /images/tasks':              'errows.character_image_gen_tasks_list',
      'POST    /images/:aid/videos/tasks':  'errows.character_video_gen_task_create',
      'GET     /videos/tasks':              'errows.character_video_tasks_list',
      'POST    /videos/tasks/:tid/retry':   'errows.character_video_gen_task_retry',
      'GET     /videos/tasks/:tid':         'errows.character_video_tasks_get',
      'POST    /tasks/:tid/speed-up':       'errows.character_task_speed_up',
    }
  }),
  routeConfig('/my/sessions', 'errows.*', {
    mergeParams: false,
    aliases: {
      'GET    /': 'errows.session_list',
      'POST   /personas': 'errows.session_persona_create',
      'GET    /personas': 'errows.session_persona_list',
      'PUT    /personas/:pid': 'errows.session_persona_update',
      'POST   /personas/:pid/characters/:cid': 'errows.session_create',
      'DELETE /personas/:pid': 'errows.session_persona_delete',
      'GET    /:sid': 'errows.session_get',
      'POST   /:sid': 'errows.session_text_message_stream',
      'PUT    /:sid': 'errows.session_update',
      'DELETE /:sid': 'errows.session_delete',
      'PUT    /:sid/messages/:mid': 'errows.session_message_update',
      'POST   /:sid/messages/:mid/tts': 'errows.session_message_tts',
      'POST   /:sid/messages/:mid/feedback/:feedback': 'errows.session_message_feedback',
      'DELETE /:sid/messages/:mid': 'errows.session_message_delete',
      'GET    /:sid/messages/suggest': 'errows.session_message_suggest',
      'POST   /:sid/messages/character/images': 'errows.session_character_image_request',
      'POST   /:sid/call': 'errows.session_voice_call_start',
      'POST   /:sid/call/:cid': 'stream:errows.session_voice_call_message',
      'POST   /:sid/call/:cid/hangup': 'errows.session_voice_call_end',
      'GET    /:sid/voice/agora-token': 'errows.session_agora_token',
      'POST   /:sid/voice/billing': 'errows.session_agora_voice_call_billing',
      'GET    /gifts': 'errows.session_gifts_list',
      'POST   /:sid/gifts/:gift_id': 'errows.session_gift_send',
    }
  }),
  routeConfig('/posts/:pid', 'errows.*', {
    aliases: {
      'POST   /feedback/:feedback': 'errows.post_feedback',
      'POST   /comments': 'errows.post_comment_create',
    }
  }),
  routeConfig('/tasks', 'errows.*', {
    'aliases': {
      'GET   /':                'errows.task_list',
      'POST  /:task_id/claim':  'errows.task_claim',
    }
  }),
  routeConfig('/members', 'user.*', {
    aliases: {
      'GET   /stats': 'user.member_stats',
      'GET   /info':  'user.member_info',
    }
  }),
  routeConfig('/payment', 'payment.*', {
    autoAliases: true
  }),
  routeConfig('/payment/stripe/webhook', 'payment.stripe_webhook', {
    authenticate: false,
    authorization: false,
    aliases: {
      'POST   /': 'payment.stripe_webhook',
    },
    bodyParsers: {
      json: false, urlencoded: false, raw: { type: 'application/json' }
    },
    mergeParams: false,
    onBeforeCall(ctx, _route, req, _res) {
      const stripeSignature = req.headers['stripe-signature'];
      ctx.meta.stripeSignature = stripeSignature;
    }
  }),
  routeConfig('/ops', 'ops.*', {
    authorization: 'ops_authorize',
    autoAliases: true,
    aliases: {
      'POST  /assets/images':       'stream:ops.image_upload',
      'GET   /llm-debug/payloads':   'ops.llm_debug_payloads',
      'GET   /config/coin-settings': 'ops.configuration_coin_settings_get',
      'PUT   /config/coin-settings': 'ops.configuration_coin_settings_update',
      'GET   /config/ai-endpoints': 'ops.configuration_ai_endpoints_get',
      'PUT   /config/ai-endpoints': 'ops.configuration_ai_endpoints_update',
      'GET   /config/home-display': 'ops.configuration_home_display_get',
      'PUT   /config/home-display': 'ops.configuration_home_display_update',
    }
  }),
  routeConfig('/ops/payment', 'payment.*', {
    authorization: 'ops_authorize',
    aliases: {
      'GET  /prices':        'payment.prices',
      'PUT  /prices':        'payment.prices_update',
      'PUT  /coins':        'payment.coin_products_upsert',
      'PUT  /subscriptions/:type': 'payment.subscription_products_upsert',
      'GET  /cdkeys':        'payment.cdkey_list',
      'POST /cdkeys':        'payment.cdkey_create',
      'PUT  /cdkeys/:id':    'payment.cdkey_update',
      'DELETE /cdkeys/:id':  'payment.cdkey_delete',
    }
  })
];

/**
 * API 网关服务定义
 * @type {import('moleculer').ServiceSchema}
 */
export default {
  mixins: [APIService],

  settings: Object.assign(
    { etag: true, }, config.api,
    { routes }
  ),

  methods: {
    signToken,
    /**
     * @description
     * 用户认证中间件, 从 HTTP 请求中提取并验证 JWT token
     *
     * Token 来源（按优先级）：
     * 1. Authorization header: Bearer <token>
     * 2. URL 查询参数: ?accessToken=<token>
     *
     * 验证项：
     * 1. Token 签名有效性
     * 2. Token 未过期
     * 3. Token 包含有效的 uid
     * 4. 如果是 accessToken，必须有 scope
     */
    async authenticate(ctx, route, req) {
      let tokenString = null;
      const authHeader = req.headers['authorization'] ?? null;

      if (authHeader !== null) {
        if ((authHeader.startsWith('Bearer ') ?? false) === false) {
          return Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN));
        }
        tokenString = authHeader.slice(7);
      }

      const accessToken = req['$params'].accessToken ?? null;
      tokenString = tokenString ?? accessToken;

      if (tokenString === null) {
        return Promise.resolve(null);
      }

      let decoded = null;
      try {
        decoded = jwt.verify(tokenString, config.jwt.secret, config.jwt.options);
      } catch (error) {
        decoded = jwt.decode(tokenString, config.jwt.secret, config.jwt.options);
        return Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN, error.message));
      }

      const scope = decoded.scope ?? null;
      // accessToken 必须有特定的 scope
      if (accessToken !== null && scope === null) {
        return Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN, 'accessToken requires scope'));
      }

      const { uid = null, exp = null, iat } = decoded;
      if (!exp) {
        const signAt = DateFns.fromUnixTime(iat);
        const expiredAt = DateFns.addDays(signAt, config.jwt.options.expiresIn);
        if (DateFns.isAfter(new Date(), expiredAt)) {
          return Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN));
        }
      }

      if ((uid ?? null) === null) {
        return Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN));
      }

      const user = { ...decoded, uid, scope };
      const userProfile = await ctx.call('user.profile', {}, { meta: { user } })
      .catch(error => {
        return Promise.reject(new UnAuthorizedError(ERR_INVALID_TOKEN, error.message));
      });
      const { email } = userProfile;
      Object.assign(user, { email });
      return user;
    },

    /**
     * @description
     * 验证用户是否有权访问当前接口
     *
     * 授权规则：
     * 1. 必须已登录（ctx.meta.user 存在）
     * 2. 如果 token 有 scope，必须匹配当前 action
     */
    authorize(ctx, router, req) {
      if ((ctx.meta.user ?? null) === null) {
        return Promise.reject(new UnAuthorizedError(ERR_NO_TOKEN));
      }

      const { scope } = ctx.meta.user;

      // 有 scope 时，需要应用到指定接口上
      if (scope !== null && scope !== req['$action'].name) {
        return Promise.reject(new ForbiddenError());
      }
    },

    ops_authorize: async function (ctx, route, req) {
      const user = ctx.meta.user ?? null;
      if (user === null) {
        return Promise.reject(new UnAuthorizedError(ERR_NO_TOKEN));
      }
      const opsProfile = await ctx.call(
        'ops.user_profile', {}, { meta: { user } }
      );
      if (opsProfile.roles.length === 0) {
        return Promise.reject(new ForbiddenError());
      }
      return this.authorize(ctx, route, req);
    }
  }
};