/**
 * Merged AI config (file + DB). Used by getAIServiceConfig, queue, utils.
 * voiceCall is not configurable from console; only image, chat, stream, video, tts.
 */
import config from 'config';
import { Configuration } from '@errows/models';

const SCOPE_AI = 'ai';
const KEY_ENDPOINTS = 'endpoints';

let cachedMerge = null;

export function getCachedMerge() {
  return cachedMerge;
}

export function setCachedMerge(value) {
  cachedMerge = value;
}

function deepMerge(base, overrides) {
  if (overrides == null || typeof overrides !== 'object') return base;
  const out = { ...base };
  for (const key of Object.keys(overrides)) {
    if (overrides[key] != null && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
      out[key] = deepMerge(base[key] ?? {}, overrides[key]);
    } else if (overrides[key] !== undefined && overrides[key] !== '') {
      out[key] = overrides[key];
    }
  }
  return out;
}

/**
 * Load AI endpoints from DB and merge with config.ai. Returns merged config for image, chat, stream, video, tts (voiceCall always from file).
 * Note: config.ai['character/refine'] is never merged here; it is used only by character-refine.mjs for text refine.
 */
export async function getMergedAIConfig(client, schema) {
  const fromDb = await Configuration.getConfiguration(client, schema, SCOPE_AI, KEY_ENDPOINTS);
  const file = config.ai || {};
  const types = ['image', 'chat', 'stream', 'video', 'tts'];
  const merged = {};
  for (const type of types) {
    const fileBlock = file[type] ?? {};
    const dbBlock = fromDb?.[type] ?? {};
    merged[type] = deepMerge(fileBlock, dbBlock);
  }
  return merged;
}

/**
 * Get config for a given AI service type (image, chat, stream, video, tts). Uses cache; voiceCall always from file.
 */
export function getMergedBlock(type) {
  const cache = getCachedMerge();
  const file = config.ai || {};
  if (cache && cache[type]) return cache[type];
  return file[type] ?? {};
}
