import React from 'react';
import { useDependentFieldAutoUpdate } from '../../hooks/use-dependent-field-auto-update';
import type { RoleDict } from '../../role-types';

/**
 * 依赖字段自动更新内部组件：在组件顶层调用 hook
 */
function DependentFieldAutoUpdateInner({
  form,
  fieldKey,
  fieldName,
  depends,
  getFieldConfig,
  currentConfig,
  currentValue,
  currentFormValues,
}: {
  form: any;
  fieldKey: string;
  fieldName: string;
  depends: string[];
  getFieldConfig: (fieldKey: string, formValues: Record<string, any>) => RoleDict | undefined;
  currentConfig: RoleDict | undefined;
  currentValue: any;
  currentFormValues: Record<string, any>;
}) {
  // 在组件顶层调用 hook
  useDependentFieldAutoUpdate({
    form,
    fieldKey,
    fieldName,
    depends,
    getFieldConfig,
    currentConfig,
    currentValue,
    currentFormValues,
  });
  return null;
}

/**
 * 依赖字段包装组件：处理依赖字段变化时的自动更新
 */
export function DependentFieldWrapper({
  form,
  fieldKey,
  fieldName,
  depends,
  getFieldConfig,
  currentConfig,
  currentFormValues,
  renderField,
}: {
  form: any;
  fieldKey: string;
  fieldName: string;
  depends: string[];
  getFieldConfig: (fieldKey: string, formValues: Record<string, any>) => RoleDict | undefined;
  currentConfig: RoleDict | undefined;
  currentFormValues: Record<string, any>;
  renderField: (field: any) => React.ReactNode;
}) {
  // 使用 Subscribe 监听字段值，然后在真正的组件中调用 hook
  return (
    <form.Subscribe selector={(state: any) => ({
      currentValue: state.values[fieldName],
      dependsValues: depends.reduce((acc, depKey) => {
        acc[depKey] = state.values[depKey];
        return acc;
      }, {} as Record<string, any>),
    })} children={({ currentValue, dependsValues }: { currentValue: any; dependsValues: Record<string, any> }) => {
      return (
        <>
          <DependentFieldAutoUpdateInner
            form={form}
            fieldKey={fieldKey}
            fieldName={fieldName}
            depends={depends}
            getFieldConfig={getFieldConfig}
            currentConfig={currentConfig}
            currentValue={currentValue}
            currentFormValues={{ ...currentFormValues, ...dependsValues } as Record<string, any>}
          />
          <form.Field name={fieldName as any} children={(field: any) => {
            return renderField(field);
          }} />
        </>
      );
    }} />
  );
}

