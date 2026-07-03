/**
 * @fileoverview AI 任务队列管理模块
 * @module services/libs/queue
 * @description 提供图像生成和视频生成的任务队列实例
 *
 * 图像队列用途：
 * - avatarQueue: 角色头像（创建/重建）+ 聊天内「索要图片」按钮
 * - imageQueue: Create Image / 画廊生图（用户选 outfit/background 等）
 * - inChatImageQueue: 聊天内自动生图（概率/关键词触发，使用 LLM 回复作为 prompt）
 *
 * 所有图像队列共用 config.ai.image 端点；视频队列用 config.ai.video。 
 */

import ai, { TaskQueue } from '@errows/ai';
import {
  readCharacterOptions,
  readCharacterImageGenSteps
} from './settings.mjs';
import { getMergedBlock } from './ai-config.mjs';

/**
 * 角色头像与索要图片队列
 * @type {TaskQueue}
 * @description
 * - 角色头像：创建角色、重建头像时生成 avatar（ai.avatarGen）
 * - 索要图片：聊天内用户点击「索要图片」按钮，生成一张角色图
 * 使用方：characters（avatar 创建/重建）、sessions（session_character_image_request）
 */
export const avatarQueue = new TaskQueue(
  async function imageGenTask(settings) {
    const { default: config } = await import('config');
    const apiKey = config.ai.apiKey;
    const options = await readCharacterOptions();
    const imageConfig = Object.assign({}, getMergedBlock('image'), { apiKey });
    return ai.avatarGen(imageConfig, options, settings);
  },
  100
);


/**
 * Create Image / 画廊生图队列
 * @type {TaskQueue}
 * @description
 * 用户主动生图：Generate Image 页、画廊等，选择 outfit/background/action 等后生成。
 * 使用 ai.imageGen(character, settings)。使用方：media（character_image_gen_task_create）
 */
export const imageQueue = new TaskQueue(
  async function imageGenTask({
    character, settings = null, auto_gen_prompt_params = null
  }) {
    const { default: config } = await import('config');
    const apiKey = config.ai.apiKey;
    const options = await readCharacterOptions();
    const steps = await readCharacterImageGenSteps();
    const imageConfig = Object.assign({}, getMergedBlock('image'), { apiKey });
    return ai.imageGen(
      imageConfig, options, steps,
      character, settings, auto_gen_prompt_params
    );
  },
  100
);

/**
 * 聊天内自动生图队列
 * @type {TaskQueue}
 * @description
 * 正常聊天时按概率或关键词自动触发的生图。使用 LLM 回复作为 prompt（ai.imageGen + auto_gen_prompt_params）。
 * 独立于 imageQueue，避免被画廊等任务阻塞。使用方：sessions（generateImageInSession）
 */
export const inChatImageQueue = new TaskQueue(
  async function imageGenTask({
    character, settings = null, auto_gen_prompt_params = null
  }) {
    const { default: config } = await import('config');
    const apiKey = config.ai.apiKey;
    const options = await readCharacterOptions();
    const steps = await readCharacterImageGenSteps();
    const imageConfig = Object.assign({}, getMergedBlock('image'), { apiKey });
    return ai.imageGen(
      imageConfig, options, steps,
      character, settings, auto_gen_prompt_params
    );
  },
  100
);

/**
 * 视频生成状态检查队列
 * @type {TaskQueue}
 * @description 轮询检查视频生成任务的完成状态
 *
 * @example
 * const { video_url, result } = await videoGenCheckQueue.append(
 *   taskId,
 *   { request_id: 'xxx-xxx-xxx' }
 * );
 */
export const videoGenCheckQueue = new TaskQueue(
  async function videoGenTask(settings) {
    const { default: config } = await import('config');
    const videoBlock = getMergedBlock('video');
    const video_state = videoBlock.video_state ?? config.ai?.video?.video_state;
    const videoCheckConfig = Object.assign(
      {}, videoBlock, { apiKey: config.ai.apiKey, endpoint: video_state }
    );
    return ai.waitingVideoTaskComplete(videoCheckConfig, settings);
  },
  100
);


/**
 * 视频生成任务队列
 * @type {TaskQueue}
 * @description 创建新的视频生成任务，提交后由 videoGenCheckQueue 轮询完成状态
 *
 * @example
 * const { request_id } = await videoGenQueue.append(
 *   taskId,
 *   { image_url: 'https://example.com/image.jpg' }
 * );
 */
export const videoGenQueue = new TaskQueue(
  async function videoGenTask(settings) {
    const { default: config } = await import('config');
    const apiKey = config.ai.apiKey;
    const videoConfig = Object.assign({}, getMergedBlock('video'), { apiKey });
    await videoGenCheckQueue.promise;
    return ai.createVideoGenTask(videoConfig, settings);
  },
  100
);
