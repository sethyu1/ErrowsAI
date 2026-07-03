/**
 * React Query 持久化缓存工具
 * 使用 localStorage 实现查询数据的持久化
 */

const STORAGE_PREFIX = 'react-query-cache:';

/**
 * 保存查询数据到 localStorage
 */
export function persistQueryData(queryKey: string[], data: unknown): void {
  try {
    const key = STORAGE_PREFIX + JSON.stringify(queryKey);
    const value = JSON.stringify({
      data,
      timestamp: Date.now(),
    });
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Failed to persist query data:', error);
  }
}

/**
 * 从 localStorage 读取查询数据
 * @param queryKey 查询键
 * @param maxAge 最大缓存时间（毫秒），默认 24 小时
 */
export function getPersistedQueryData<T>(
  queryKey: string[],
  maxAge: number = 1000 * 60 * 60 * 24
): T | null {
  try {
    const key = STORAGE_PREFIX + JSON.stringify(queryKey);
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    // 检查数据是否过期
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data as T;
  } catch (error) {
    console.warn('Failed to get persisted query data:', error);
    return null;
  }
}

/**
 * 清除持久化的查询数据
 */
export function clearPersistedQueryData(queryKey?: string[]): void {
  try {
    if (queryKey) {
      const key = STORAGE_PREFIX + JSON.stringify(queryKey);
      localStorage.removeItem(key);
    } else {
      // 清除所有持久化的查询数据
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.warn('Failed to clear persisted query data:', error);
  }
}

