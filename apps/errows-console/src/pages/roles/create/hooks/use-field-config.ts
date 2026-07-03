import { useMemo } from 'react';
import type { RoleDict } from '../types';

/**
 * 获取字段配置的 Hook
 */
export function useFieldConfig(
  groupDict: Record<string, RoleDict[]>,
  formDependsConfig: Record<string, string[]>
) {
  // 获取指定字段的配置
  const getFieldConfig = useMemo(() => {
    return (fieldKey: string, formValues: Record<string, any>): RoleDict | undefined => {
      const configs = groupDict[fieldKey];
      if (!configs || configs.length === 0) return undefined;

      // 如果只有一个配置，直接返回
      if (configs.length === 1) return configs[0];

      // 如果有多个配置，根据依赖条件筛选
      const dependFields = formDependsConfig[fieldKey] || [];
      
      for (const config of configs) {
        let isMatch = true;
        
        // 检查所有依赖条件
        for (const [depKey, depValues] of config.depends || []) {
          const formValue = formValues[depKey];
          if (!depValues.includes(formValue)) {
            isMatch = false;
            break;
          }
        }
        
        if (isMatch) return config;
      }

      return configs[0]; // 默认返回第一个
    };
  }, [groupDict, formDependsConfig]);

  return { getFieldConfig };
}

