import { getEnvValue } from './env';

const storagePrefix = getEnvValue('VITE_STORAGE_PREFIX');

/**
 * 添加前缀到key
 * @param key key
 * @returns key with prefix
 */
export function addPrefix(key: string) {
  return storagePrefix ? `${storagePrefix}.${key}` : key;
}
