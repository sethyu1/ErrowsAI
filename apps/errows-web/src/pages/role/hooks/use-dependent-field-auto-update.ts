import { useEffect, useRef } from 'react';
import type { RoleDict } from '../role-types';

interface UseDependentFieldAutoUpdateProps {
  form: any;
  fieldKey: string;
  fieldName: string;
  depends: string[];
  getFieldConfig: (fieldKey: string, formValues: Record<string, any>) => RoleDict | undefined;
  currentConfig: RoleDict | undefined;
  currentValue: any;
  currentFormValues: Record<string, any>;
}

/**
 * 依赖字段自动更新 Hook：当被依赖的字段改变时，如果当前字段的值不在新配置的选项中，则自动设置为第一个选项
 */
export function useDependentFieldAutoUpdate({
  form,
  fieldKey,
  fieldName,
  depends,
  getFieldConfig,
  currentConfig,
  currentValue,
  currentFormValues,
}: UseDependentFieldAutoUpdateProps) {
  const prevDependsValuesRef = useRef<Record<string, any>>({});
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // 跳过首次渲染（初始值设置由 useStepDefaultValues 处理）
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      // 记录初始依赖值
      const initialDependsValues: Record<string, any> = {};
      depends.forEach((depKey) => {
        initialDependsValues[depKey] = currentFormValues[depKey];
      });
      prevDependsValuesRef.current = initialDependsValues;
      return;
    }

    // 检查依赖值是否发生变化
    const currentDependsValues: Record<string, any> = {};
    let hasChanged = false;
    depends.forEach((depKey) => {
      const currentDepValue = currentFormValues[depKey];
      currentDependsValues[depKey] = currentDepValue;
      
      // 检查是否有变化
      if (prevDependsValuesRef.current[depKey] !== currentDepValue) {
        hasChanged = true;
      }
    });

    // 如果依赖值没有变化，直接返回
    if (!hasChanged) {
      return;
    }

    // 更新记录的依赖值
    prevDependsValuesRef.current = currentDependsValues;

    // 重新获取配置（基于新的依赖值）
    const updatedConfig = getFieldConfig(fieldKey, currentFormValues);
    
    // 如果配置不存在或没有选项，直接返回
    if (!updatedConfig || !updatedConfig.options || updatedConfig.options.length === 0) {
      return;
    }

    // 检查当前值是否在新配置的选项中
    const valueInOptions = updatedConfig.options.some(
      (opt) => opt.value === currentValue
    );

    // 如果当前值不在选项中，设置为第一个选项
    if (!valueInOptions && updatedConfig.options[0]?.value) {
      const firstOptionValue = updatedConfig.options[0].value;
      form.setFieldValue(fieldName, firstOptionValue);
    }
  }, [
    form,
    fieldKey,
    fieldName,
    depends,
    getFieldConfig,
    currentConfig,
    currentValue,
    currentFormValues,
  ]);
}

