/**
 * 获取默认语言
 * @returns
 */
export function getDefaultLocale() {
  return localStorage.getItem('i18nextLng') || 'us';
}
