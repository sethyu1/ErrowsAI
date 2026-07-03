import dayjs, { type ConfigType  } from 'dayjs';

/**
 * 格式化日期
 * @param date
 * @param format
 * @returns
 */
export function formatDate(date: ConfigType, format = 'YYYY-MM-DD') {
  return dayjs(date).format(format);
}
