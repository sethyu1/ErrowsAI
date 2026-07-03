import type { RoleDict } from './types';

/**
 * 按指定键对数组进行分组
 */
export function groupBy<T extends Record<string, any>>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * 生成表单依赖配置
 * 返回每个字段依赖的其他字段列表
 */
export function generateFormDependsConfig(
  groupDict: Record<string, RoleDict[]>
): Record<string, string[]> {
  const config: Record<string, string[]> = {};
  
  Object.entries(groupDict).forEach(([key, configs]) => {
    const dependFields = new Set<string>();
    
    configs.forEach(cfg => {
      if (cfg.depends && cfg.depends.length > 0) {
        cfg.depends.forEach(([depKey]) => {
          dependFields.add(depKey);
        });
      }
    });
    
    config[key] = Array.from(dependFields);
  });
  
  return config;
}

/**
 * 检查字段是否应该显示（根据依赖条件）
 * 用于校验时判断字段是否需要被校验
 */
export function shouldShowField(field: RoleDict, formValues: Record<string, any>): boolean {
  if (!field.depends || field.depends.length === 0) {
    return true;
  }

  // 所有依赖条件都必须满足
  return field.depends.every(([depKey, depValues]) => {
    const currentValue = formValues[depKey];
    return depValues.includes(currentValue);
  });
}

