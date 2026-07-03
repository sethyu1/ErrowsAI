import { useCallback } from 'react';
import { getFormDepends } from '../role-util';
import type { RoleGroup, RoleDict } from '../role-types';

/**
 * 字段配置相关的 Hook
 */
export function useFieldConfig(
  groupDict: RoleGroup,
  formDependsConfig: Record<string, string[]>
) {
  // 根据字段 key 和当前表单值获取字段配置
  const getFieldConfig = useCallback(
    (fieldKey: string, formValues: Record<string, any>): RoleDict | undefined => {
      if (!groupDict[fieldKey] || groupDict[fieldKey].length === 0) {
        return undefined;
      }

      // 获取该字段的依赖字段列表
      const depends = formDependsConfig[fieldKey] || [];
      
      // 如果没有依赖，直接返回第一个配置
      if (depends.length === 0) {
        return groupDict[fieldKey][0];
      }

      // 构建依赖值映射
      const dependsValues: Record<string, string | number> = {};
      depends.forEach((depKey) => {
        const depValue = formValues[depKey];
        if (depValue !== undefined && depValue !== null) {
          dependsValues[depKey] = depValue as any
        }
      });

      // 使用 getFormDepends 获取匹配的配置
      return getFormDepends({
        group: groupDict,
        field: fieldKey,
        dependsValues,
      });
    },
    [groupDict, formDependsConfig]
  );

  return {
    getFieldConfig,
  };
}

