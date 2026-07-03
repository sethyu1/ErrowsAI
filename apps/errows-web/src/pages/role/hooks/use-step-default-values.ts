import { useEffect } from 'react';
import type { CreateDialogFormData } from '../types';
import type { RoleDict } from '../role-types';

interface UseStepDefaultValuesProps {
  step: number;
  form: any;
  stepFields: string[];
  getFieldConfig: (fieldKey: string, formValues: Record<string, any>) => RoleDict | undefined;
  formDependsConfig: Record<string, string[]>;
}

/**
 * 步骤默认值 Hook：当进入步骤时，为没有值的字段设置第一个选项作为默认值
 */
/**
 * 对字段进行拓扑排序，确保依赖字段在被依赖字段之后处理
 */
function sortFieldsByDependencies(
  fields: string[],
  formDependsConfig: Record<string, string[]>
): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (fieldKey: string) => {
    if (visiting.has(fieldKey)) {
      // 循环依赖，直接添加
      if (!visited.has(fieldKey)) {
        sorted.push(fieldKey);
        visited.add(fieldKey);
      }
      return;
    }

    if (visited.has(fieldKey)) {
      return;
    }

    visiting.add(fieldKey);

    // 先处理依赖的字段
    const depends = formDependsConfig[fieldKey] || [];
    depends.forEach((depKey) => {
      // 只处理同一步骤中的依赖字段
      if (fields.includes(depKey)) {
        visit(depKey);
      }
    });

    visiting.delete(fieldKey);
    sorted.push(fieldKey);
    visited.add(fieldKey);
  };

  fields.forEach((fieldKey) => {
    if (!visited.has(fieldKey)) {
      visit(fieldKey);
    }
  });

  return sorted;
}

export function useStepDefaultValues({
  step,
  form,
  stepFields,
  getFieldConfig,
  formDependsConfig,
}: UseStepDefaultValuesProps) {
  useEffect(() => {
    // 只在步骤 1、2、3、4 时执行
    if (step < 1 || step > 4 || !stepFields?.length) {
      return;
    }

    // 初始表单值
    const initialValues = form.state.values as Record<string, any>;
    // 动态累积的当前值，用于处理字段间的依赖关系
    const dynamicValues = { ...initialValues };
    const updates: Array<{ fieldName: string; value: any }> = [];

    // 按照依赖关系排序字段，确保依赖字段在被依赖字段之后处理
    const sortedFields = sortFieldsByDependencies(stepFields, formDependsConfig);

    sortedFields.forEach((fieldKey) => {
      const fieldName = fieldKey;
      const currentValue = dynamicValues[fieldName];

      // 使用动态累积的值来获取字段配置，这样可以正确匹配依赖关系
      const fieldConfig = getFieldConfig(fieldKey, dynamicValues);
      if (!fieldConfig) {
        return;
      }

      // 根据gender 依赖判断，性别不匹配，即使是required，也不设置默认值
      const gender = initialValues.gender;
      const genderDepends = fieldConfig.depends?.find(item => item[0] === 'gender')?.[1];
      if(genderDepends && genderDepends.length > 0 && !genderDepends.includes(gender)) {
        return;
      }

      // 对于 dialogue_list 类型，如果没有值或为空数组，设置默认值
      if (fieldConfig.input_type === 'dialogue_list') {
        if (!Array.isArray(currentValue) || currentValue.length === 0) {
          const defaultValue = [{ user: '', character: '' }];
          updates.push({
            fieldName,
            value: defaultValue,
          });
          // 更新动态值
          (dynamicValues as any)[fieldName] = defaultValue;
        }
        return;
      }

      // 其他类型需要 options
      if (!fieldConfig.options || fieldConfig.options.length === 0) {
        return;
      }

      // 获取第一个选项的值
      const firstOption = fieldConfig.options[0];
      if (!firstOption || !firstOption.value) {
        return;
      }

      // 对于第一步的字段，需要特殊处理
      if (step === 1) {
        if (fieldKey === 'gender') {
          // gender 字段：检查当前值是否在配置的选项中
          const valueInOptions = fieldConfig.options.some(opt => opt.value === currentValue);
          
          if (valueInOptions) {
            // 如果当前值在选项中（包括 'female'），保持不变，只更新动态值
            (dynamicValues as any)[fieldName] = currentValue;
          } else if (currentValue === undefined || currentValue === null || currentValue === '') {
            // 只有当前值为空时，才设置为第一个选项
            const newValue = firstOption.value;
            updates.push({
              fieldName,
              value: newValue,
            });
            (dynamicValues as any)[fieldName] = newValue;
          }
          return;
        } else if (fieldKey === 'type') {
          // type 字段：检查当前值是否在配置的选项中
          const valueInOptions = fieldConfig.options.some(opt => opt.value === currentValue);
          // 如果当前值不在选项中，或者没有值，设置为第一个选项
          if (!valueInOptions || currentValue === undefined || currentValue === null || currentValue === '') {
            if (firstOption.value !== currentValue) {
              const newValue = firstOption.value;
              updates.push({
                fieldName,
                value: newValue,
              });
              // 更新动态值
              (dynamicValues as any)[fieldName] = newValue;
            }
          }
          return;
        }
      }

      // 对于其他步骤，如果字段已有值，跳过（这是关键：返回上一步时字段已有值，不会重新设置）
      if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
        // 如果字段已有值，更新动态值以便后续字段可以基于这个值进行匹配，但不添加到更新列表
        (dynamicValues as any)[fieldName] = currentValue;
        return;
      }

      // 只有字段没有值时才设置默认值（这意味着返回上一步时，如果字段已有值，不会执行到这里）
      const newValue = firstOption.value;
      if(fieldConfig.required)updates.push({
        fieldName,
        value: newValue,
      });
      // 更新动态值，以便后续字段可以基于这个新值进行匹配
      (dynamicValues as any)[fieldName] = newValue;
    });

    // 批量更新字段值
    if (updates.length > 0) {
      updates.forEach(({ fieldName, value }) => {
        form.setFieldValue(fieldName, value);
      });
    }
  }, [step, stepFields, form, getFieldConfig, formDependsConfig]);
}

