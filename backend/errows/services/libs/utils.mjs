/**
 * @fileoverview 通用工具函数模块
 * @module services/libs/utils
 * @description 提供文件系统操作和URL处理等通用工具函数
 */

import fs from 'node:fs';
import config from 'config';
import { getMergedBlock } from './ai-config.mjs';

/**
 * 确保目录存在，如果不存在则创建
 * @async
 * @function ensureDir
 * @param {string} path - 需要确保存在的目录路径
 * @returns {Promise<void>}
 * @throws {Error} 如果创建目录失败
 *
 * @example
 * await ensureDir('/path/to/directory');
 * // 目录现在已确保存在
 */
export async function ensureDir(path) {
  const dirExists = await fs.promises.stat(path).then(() => true, () => false);
  if (dirExists === false) {
    await fs.promises.mkdir(path, { recursive: true });
  }
  return path;
}

/**
 * 将相对路径转换为完整的资源URL
 * @function resolveAssetUrl
 * @param {string} url - 相对URL路径（可能以 / 开头）
 * @returns {string} 完整的资源URL（包含 baseUrl）
 *
 * @example
 * const fullUrl = resolveAssetUrl('/uploads/image.jpg');
 * // 返回: 'https://assets.example.com/uploads/image.jpg'
 *
 * @example
 * const fullUrl = resolveAssetUrl('uploads/image.jpg');
 * // 返回: 'https://assets.example.com/uploads/image.jpg'
 */
export function resolveAssetUrl(url) {
  if (url.startsWith('User_Generate/')) {
    return resolveAIImageUrl(url);
  }
  return resolveUserUploadUrl(url);
}

/**
 * 将用户上传文件的相对路径转换为完整的资源URL
 * @function resolveUserUploadUrl
 * @param {string} url - 相对URL路径（可能以 / 开头）
 * @returns {string} 完整的资源URL（包含 baseUrl）
 *
 * @example
 * const fullUrl = resolveAssetUrl('/uploads/image.jpg');
 * // 返回: 'https://assets.example.com/uploads/image.jpg'
 *
 * @example
 * const fullUrl = resolveAssetUrl('uploads/image.jpg');
 * // 返回: 'https://assets.example.com/uploads/image.jpg'
 */
export function resolveUserUploadUrl(url) {
  return new URL(url, config.assets.baseUrl).href;
}

/**
 * @function resolveAIImageUrl
 * @param {string} url - 角色头像的相对URL路径（可能以 / 开头）
 * @returns {string} 完整的角色头像URL（包含 baseUrl）
) */
export function resolveAIImageUrl(url) {
  const baseUrl = getMergedBlock('image').baseUrl ?? config.ai?.image?.baseUrl ?? '';
  return new URL(url, baseUrl).href;
}

/**
 * @function resolveAIVideoUrl
 * @param {string} url - AI视频的相对URL路径（可能以 / 开头）
 * @returns {string} 完整的AI视频URL（包含 baseUrl）
 */
export function resolveAIVideoUrl(url) {
  const baseUrl = getMergedBlock('video').baseUrl ?? config.ai?.video?.baseUrl ?? '';
  return new URL(url, baseUrl).href;
}

/**
 * @function resolveAITTtsUrl
 * @description 将AI文本转语音的相对URL转换为完整的URL
 * @param {string} url
 * @returns {string}
 */
export function resolveAITTtsUrl(url) {
  const baseUrl = getMergedBlock('tts').baseUrl ?? config.ai?.tts?.baseUrl ?? '';
  return new URL(url, baseUrl).href;
}

export function buildSSEChunk(event, data = null) {
  if (data === null) {
    return `event: ${event}\ndata: \n\n`;
  }

  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }
  return `event: ${event}\ndata: ${data}\n\n`;
}