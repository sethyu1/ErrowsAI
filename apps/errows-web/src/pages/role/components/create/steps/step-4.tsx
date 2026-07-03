import React from 'react';
import { useTranslation } from 'react-i18next';
import { renderField } from '../form-field-renderer';
import { useStepDefaultValues } from '../../../hooks/use-step-default-values';
import { DependentFieldWrapper } from '../dependent-field-wrapper';
import type { RoleDict } from '../../../role-types';

interface Step4Props {
  form: any;
  stepFields: string[];
  getFieldConfig: (fieldKey: string, formValues: Record<string, any>) => RoleDict | undefined;
  formDependsConfig: Record<string, string[]>;
  isMobile?: boolean;
}

/**
 * 第四步：个性和对话（声音、昵称、描述、对话设置等）
 */
export function Step4({ form, stepFields, getFieldConfig, formDependsConfig, isMobile }: Step4Props) {
  const { t, i18n } = useTranslation();
  // 设置步骤默认值
  useStepDefaultValues({
    step: 4,
    form,
    stepFields,
    getFieldConfig,
    formDependsConfig,
  });

  return (
    <>
      {stepFields.map((fieldKey) => {
        const fieldConfig = getFieldConfig(fieldKey, form.state.values as Record<string, any>);
        if (!fieldConfig) return null;

        const fieldName = fieldKey;
        const depends = formDependsConfig[fieldKey] || [];

        // 如果没有依赖，直接渲染
        // 但对于 introduction 字段，需要订阅 nickname 字段以实时获取值
        if (depends.length === 0) {
          // introduction 字段需要实时获取 nickname
          if (fieldKey === 'introduction') {
            return (
              <form.Subscribe key={fieldKey} selector={(state: any) => state.values.nickname} children={(nickname: string) => {
                const currentValues = { ...form.state.values, nickname } as Record<string, any>;
                const updatedConfig = getFieldConfig(fieldKey, currentValues);
                if (!updatedConfig) return null;

                return (
                  <form.Field name={fieldName as any} children={(field: any) => {
                    const handleValueChange = (value: any) => {
                      field.handleChange(value);
                    };

                    return renderField(
                      {
                        t,
                        i18n
                      },
                      updatedConfig as any,
                      field.state.value,
                      handleValueChange,
                      currentValues as any,
                      form,
                      isMobile,
                    );
                  }} />
                );
              }} />
            );
          }

          return (
            <form.Field key={fieldKey} name={fieldName as any} children={(field: any) => {
              const handleValueChange = (value: any) => {
                field.handleChange(value);
              };

              return renderField(
                {
                  t,
                  i18n
                },
                fieldConfig as any,
                field.state.value,
                handleValueChange,
                form.state.values as any,
                form,
                isMobile,
              );
            }} />
          );
        }

        // 如果有依赖，使用 Subscribe 监听依赖字段的变化
        const subscribeSelector = (state: any) => {
          const values: Record<string, any> = {};
          depends.forEach((depKey) => {
            values[depKey] = state.values[depKey];
          });
          return values;
        };

        return (
          <form.Subscribe key={fieldKey} selector={subscribeSelector} children={(depValues: Record<string, any>) => {
            const currentValues = { ...form.state.values, ...depValues } as Record<string, any>;
            const updatedConfig = getFieldConfig(fieldKey, currentValues);
            if (!updatedConfig) return null;

            return (
              <DependentFieldWrapper
                form={form}
                fieldKey={fieldKey}
                fieldName={fieldName}
                depends={depends}
                getFieldConfig={getFieldConfig}
                currentConfig={updatedConfig}
                currentFormValues={currentValues}
                renderField={(field: any) => {
                  const handleValueChange = (value: any) => {
                    field.handleChange(value);
                  };

                  return renderField(
                    {
                      t,
                      i18n
                    },
                    updatedConfig as any,
                    field.state.value,
                    handleValueChange,
                    currentValues as any,
                    form,
                    isMobile,
                  );
                }}
              />
            );
          }} />
        );
      })}
    </>
  );
}

