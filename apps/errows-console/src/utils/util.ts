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
