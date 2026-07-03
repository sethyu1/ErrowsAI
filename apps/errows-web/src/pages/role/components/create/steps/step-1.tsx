import React from 'react';
import { useTranslation } from 'react-i18next';
import { PillButtonSelector, ModeSelector } from '../form-steps';
import { RoleImageSelector} from '@/components';
import { SectionTitle } from '../components/section-title';
import { useStepDefaultValues } from '../../../hooks/use-step-default-values';
import type { CreateDialogFormData } from '../../../types';
import type { RoleDict } from '../../../role-types';

interface Step1Props {
  form: any;
  isMobile: boolean;
  getFieldConfig: (fieldKey: string, formValues: Record<string, any>) => RoleDict | undefined;
  formDependsConfig: Record<string, string[]>;
}

/**
 * 第一步：基础信息（性别、风格、创建模式）
 */
export function Step1({ form, isMobile, getFieldConfig, formDependsConfig }: Step1Props) {
  const { t } = useTranslation();
  // 设置步骤默认值（处理 gender 和 type 字段）
  useStepDefaultValues({
    step: 1,
    form,
    stepFields: ['gender', 'type'],
    getFieldConfig,
    formDependsConfig,
  });
  return (
    <>
      {/* gender 字段使用 PillButtonSelector 组件 */}
      <form.Field name="gender" children={(field: any) => {
        const genderConfig = getFieldConfig('gender', form.state.values as CreateDialogFormData);
        const genderOptions = (genderConfig?.options || []).map(opt => ({
          value: opt.value,
          prompt: t(`characterOptions.labels.${opt.value}`),
        }));

        const handleGenderChange = (nextValue: API.Common.Gender) => {
          field.handleChange(nextValue);
        };

        return (
          <section className="flex flex-col items-center gap-4">
            <PillButtonSelector
              value={field.state.value}
              onChange={handleGenderChange}
              options={genderOptions}
            />
          </section>
        );
      }} />

      {/* type (style) 字段使用 ImageSelector 组件（large 尺寸） */}
      <form.Subscribe selector={(s: any) => s.values.gender} children={(currentGender: CreateDialogFormData['gender']) => {
        const currentValues = { ...form.state.values, gender: currentGender } as CreateDialogFormData;
        const typeConfig = getFieldConfig('type', currentValues);
        
        if (!typeConfig) return null;

        // 转换 API 选项格式：添加 label 字段
        const options = typeConfig.options.map((opt: any) => ({
          value: opt.value,
          label: opt.value,
          url: opt.url,
        }));

        return (
          <form.Field name="type" children={(field: any) => {
            const handleTypeChange = (nextValue: string) => {
              const typedValue = nextValue as API.Character.Setting['type'];
              field.handleChange(typedValue);
            };

            return (
              <section className="flex flex-col items-center gap-4">
                {typeConfig.title && (
                  <SectionTitle center={true}>{t(`characterOptions.titles.${typeConfig.key}`)}</SectionTitle>
                )}
                <RoleImageSelector
                  value={field.state.value}
                  onChange={handleTypeChange}
                  options={options}
                  size="large"
                  isMobile={isMobile}
                />
              </section>
            );
          }} />
        );
      }} />

      {/* mode 不动态配置 - 内联 CreationModeSelector */}
      {/* <form.Field name="creationMode" children={(field: any) => (
        <section className="flex flex-col items-center gap-4">
          <SectionTitle center={true}>
            <span>{t('createCharacter.chooseCreationMode')}</span>
            </SectionTitle>
          <ModeSelector isMobile={isMobile} value={field.state.value} onChange={v => field.handleChange(v as any)} />
        </section>
      )} /> */}
    </>
  );
}

