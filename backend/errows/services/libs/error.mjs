/**
 * @fileoverview 错误处理工具模块
 * @module services/libs/error
 * @description 提供统一的模型错误处理函数，将模型层错误转换为 HTTP 错误
 */

import moleculer from 'moleculer';
import MoleculerWeb from 'moleculer-web';
import {
  SESSION_MODEL_ERROR,
  CHARACTER_MODEL_ERROR,
  POST_MODEL_ERROR,
  USER_MODEL_ERROR,
  MEMBER_MODEL_ERROR,
  PAYMENT_MODEL_ERROR,
  TASK_MODEL_ERROR,
  CONFIGURATION_MODEL_ERROR,
  GIFT_MODEL_ERROR
} from '@errows/models';


const { MoleculerClientError, MoleculerServerError } = moleculer.Errors;
const { Errors: { NotFoundError, UnAuthorizedError } } = MoleculerWeb;

/**
 * 处理会话模型错误
 * @function sessionErrorHandler
 * @param {Error} error - 捕获的错误对象
 * @throws {NotFoundError} 当会话、角色或消息不存在时
 * @throws {MoleculerClientError} 当操作被禁止时（403）
 * @throws {Error} 其他未处理的错误
 * @returns {void}
 *
 * @example
 * try {
 *   await Session.get(pool, schema, sessionId);
 * } catch (error) {
 *   sessionErrorHandler(error);
 * }
 */
export function sessionErrorHandler(error) {
  if ((error instanceof SESSION_MODEL_ERROR) === false) {
    throw error;
  }

  if (error.type === 'SESSION_NOT_FOUND') {
    throw new NotFoundError(error.message);
  }

  if (error.type === 'SESSION_PERSONA_NOT_FOUND') {
    throw new NotFoundError(error.message);
  }

  if (error.type === 'SESSION_MESSAGE_NOT_FOUND') {
    throw new NotFoundError(error.message);
  }

  if (error.type === 'FORBIDDEN_TO_UPDATE_NOT_LAST_USER_MESSAGE') {
    throw new MoleculerClientError(error.message, 403);
  }

  throw error;
}

/**
 * 处理角色模型错误
 * @function characterErrorHandler
 * @param {Error} error - 捕获的错误对象
 * @throws {NotFoundError} 当角色、图像或视频不存在时（404）
 * @throws {Error} 其他未处理的错误
 * @returns {void}
 *
 * @example
 * try {
 *   await Character.get(pool, schema, characterId);
 * } catch (error) {
 *   characterErrorHandler(error);
 * }
 */
export function characterErrorHandler(error) {
  if ((error instanceof CHARACTER_MODEL_ERROR) === false) {
    throw error;
  }

  if (error.type === 'CHARACTER_NOT_FOUND') {
    throw new NotFoundError('Character not found');
  }

  if (error.type === 'IMAGE_NOT_FOUND') {
    throw new NotFoundError('Character image not found');
  }

  if (error.type === 'VIDEO_NOT_FOUND') {
    throw new NotFoundError('Character video not found');
  }

  if (error.type === 'VIDEO_TASK_NOT_FOUND') {
    throw new MoleculerServerError('Character video generation task not found');
  }

  throw error;
}

/**
 * 处理帖子模型错误
 * @function postErrorHandler
 * @param {Error} error - 捕获的错误对象
 * @throws {NotFoundError} 当帖子不存在时（404）
 * @throws {Error} 其他未处理的错误
 * @returns {void}
 *
 * @example
 * try {
 *   await Post.get(pool, schema, postId);
 * } catch (error) {
 *   postErrorHandler(error);
 * }
 */
export function postErrorHandler(error) {
  if ((error instanceof POST_MODEL_ERROR) === false) {
    throw error;
  }

  if (error.type === 'POST_NOT_FOUND') {
    throw new NotFoundError(error.message);
  }

  throw error;
}

/**
 * 处理用户模型错误
 * @function userErrorHandler
 * @param {Error} error - 捕获的错误对象
 * @throws {NotFoundError} 当用户不存在时（404）
 * @throws {MoleculerClientError} 当操作被禁止时（403）
 * @throws {Error} 其他未处理的错误
 * @returns {void}
 *
 * @example
 * try {
 *   await User.get(pool, schema, userId);
 * } catch (error) {
 *   userErrorHandler(error);
 * }
 */
export function userErrorHandler(error) {
  if ((error instanceof USER_MODEL_ERROR) === false) {
    throw error;
  }

  if (error.type === 'INVALID_CREDENTIALS') {
    throw new MoleculerClientError(error.message, 400);
  }

  if (error.type === 'USER_NOT_FOUND') {
    throw new UnAuthorizedError(error.message);
  }

  if (error.type === 'EMAIL_NOT_FOUND') {
    throw new NotFoundError('Email not found.');
  }

  if (error.type === 'CODE_GEN_RATE_LIMIT') {
    throw new MoleculerClientError(error.message, 429);
  }

  // 验证码不再过期 - 移除过期检查
  // if (error.type === 'CODE_EXPIRED') {
  //   throw new MoleculerClientError(error.message, 400);
  // }

  if (error.type === 'CODE_MISS_MATCH') {
    throw new MoleculerClientError(error.message, 400);
  }

  if (error.type === 'EMAIL_ALREADY_REGISTERED') {
    throw new MoleculerClientError(error.message, 400);
  }

  if (error.type === 'EMAIL_NOT_VERIFIED') {
    throw new MoleculerClientError(error.message, 401);
  }

  throw error;
}

export function memberErrorHandler(error) {
  if ((error instanceof MEMBER_MODEL_ERROR) === false) {
    throw error;
  }

  if (error.type === 'MEMBER_NOT_FOUND') {
    throw new MoleculerServerError('Member not found');
  }

  throw error;
}

export function paymentErrorHandler(error) {
  if ((error instanceof PAYMENT_MODEL_ERROR) === false) {
    throw error;
  }

  if (error.type === 'CDKEY_NOT_FOUND') {
    throw new MoleculerClientError('CD Key not found', 404);
  }

  if (error.type === 'CDKEY_ALREADY_REDEEMED') {
    throw new MoleculerClientError(error.message || 'CD Key already redeemed', 400);
  }

  if (error.type === 'DOWNGRADE_NOT_ALLOWED') {
    throw new MoleculerClientError(error.message, 400);
  }

  if (error.type === 'INSUFFICIENT_BALANCE') {
    throw new MoleculerClientError('Your coin balance is insufficient. Please recharge and try again.', 402, error.type);
  }

  throw error;
}

export function taskErrorHandler(error) {
  if ((error instanceof TASK_MODEL_ERROR) === false) {
    throw error;
  }

  if (error.type === 'TASK_NOT_FOUND') {
    throw new NotFoundError('Task not found');
  }

  if (error.type === 'TASK_ALREADY_CLAIMED') {
    throw new MoleculerClientError('Task reward already claimed', 409);
  }

  if (error.type === 'TASK_NOT_COMPLETED') {
    throw new MoleculerClientError('Task not completed yet', 400);
  }

  throw error;
}

/**
 * 处理配置模型错误
 * @function configurationErrorHandler
 * @param {Error} error - 捕获的错误对象
 * @throws {NotFoundError} 当配置不存在时（404）
 * @throws {Error} 其他未处理的错误
 * @returns {void}
 *
 * @example
 * try {
 *   await Configuration.getConfiguration(pool, schema, scope, key);
 * } catch (error) {
 *   configurationErrorHandler(error);
 * }
 */
export function configurationErrorHandler(error) {
  if ((error instanceof CONFIGURATION_MODEL_ERROR) === false) {
    throw error;
  }

  if (error.type === 'CONFIGURATION_NOT_FOUND') {
    throw new NotFoundError('Configuration not found');
  }

  throw error;
}

/**
 * 处理礼物模型错误
 * @function giftErrorHandler
 * @param {Error} error - 捕获的错误对象
 * @throws {NotFoundError} 当礼物不存在时（404）
 * @throws {Error} 其他未处理的错误
 * @returns {void}
 *
 * @example
 * try {
 *   await Gift.getGift(pool, schema, giftId);
 * } catch (error) {
 *   giftErrorHandler(error);
 * }
 */
export function giftErrorHandler(error) {
  if ((error instanceof GIFT_MODEL_ERROR) === false) {
    throw error;
  }

  if (error.type === 'GIFT_NOT_FOUND') {
    throw new NotFoundError('Gift not found');
  }

  throw error;
}