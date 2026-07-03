/**
 * 补全 Token 值，不存在前缀 Bearer 时，自动补全
 * @param token
 * @returns
 */
export function formatToken(token: string, prefix = 'Bearer'): string {
  if (token && !token.startsWith(prefix)) {
    return `${prefix} ${token}`;
  }

  return token;
}


/**
 * lodash groupBy
 * @param collection 要分组的集合
 * @param iteratee 分组键或分组函数
 * @returns 分组后的对象，键为分组值，值为该组的所有元素数组
 */
export function groupBy<T extends Record<string, any>>(
  collection: T[],
  iteratee: string | ((item: T) => string | number)
): Record<string, T[]> {
  const result: Record<string, T[]> = {};

  for (const item of collection) {
    let key: string | number;

    if (typeof iteratee === 'string') {
      // 如果是字符串，作为对象属性访问
      key = item[iteratee];
    } else {
      // 如果是函数，调用函数获取键
      key = iteratee(item);
    }

    // 将键转换为字符串（确保一致性）
    const keyStr = String(key);

    // 初始化数组（如果不存在）
    if (!result[keyStr]) {
      result[keyStr] = [];
    }

    // 将元素添加到对应的组
    result[keyStr].push(item);
  }

  return result;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return String(num);
}