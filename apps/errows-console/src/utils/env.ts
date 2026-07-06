/**
 * 环境变量表达式是静态转换的，必须使用完整的静态字符串来引用它们。
 * 以下方式获取不到
 *   import.meta.env
 *   import.meta.env['FOO']
 */
const envMap = {
  VITE_STORAGE_PREFIX: import.meta.env.VITE_STORAGE_PREFIX ?? 'errows-console',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  VITE_IMAGE_BASE_URL: import.meta.env.VITE_IMAGE_BASE_URL ?? "https://my-bucket.s3.amazonaws.com",
};

export function getEnvValue(key: keyof typeof envMap): string {
  // 优先使用构建时注入的环境变量
  if (envMap[key]) {
    return envMap[key];
  }

  // 尝试从 window 获取（用于动态注入）
  try {
    const windowEnv = (window as unknown as { import_meta_env?: Record<string, string> }).import_meta_env;
    if (windowEnv?.[key]) {
      return windowEnv[key];
    }
  } catch (error) {
    console.error(error);
  }

  // 返回默认值
  return envMap[key];
}
