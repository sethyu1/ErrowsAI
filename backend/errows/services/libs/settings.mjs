/**
 * @fileoverview 配置文件读取模块
 * @module services/libs/settings
 * @description 提供静态配置文件的读取功能，主要用于角色创建和图像生成选项
 */

import path from 'node:path';
import fs from 'node:fs';

const __dirname = new URL('.', import.meta.url).pathname;

/**
 * 读取角色创建选项配置
 * @async
 * @function readCharacterOptions
 * @returns {Promise<Array>} 角色创建选项配置数组
 * @throws {Error} 如果文件读取或解析失败
 * 
 * @example
 * const options = await readCharacterOptions();
 * // 返回: [
 * //   { key: 'gender', label: 'Gender', options: [...] },
 * //   { key: 'type', label: 'Type', options: [...] },
 * //   ...
 * // ]
 */
export async function readCharacterOptions() {
  const file_path = path.join(__dirname, '../../static/character_creation.json');
  const file_content = await fs.promises.readFile(file_path, 'utf-8');
  return JSON.parse(file_content);
}

/**
 * 读取角色图像生成步骤配置
 * @async
 * @function readCharacterImageGenSteps
 * @returns {Promise<Array>} 图像生成步骤配置数组
 * @throws {Error} 如果文件读取或解析失败
 * 
 * @example
 * const steps = await readCharacterImageGenSteps();
 * // 返回图像生成的配置步骤
 */
export async function readCharacterImageGenSteps() {
  const file_path = path.join(__dirname, '../../static/character_image.json');
  const file_content = await fs.promises.readFile(file_path, 'utf-8');
  return JSON.parse(file_content);
}
