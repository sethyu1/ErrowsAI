import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { StepBar } from '../components/create/step-bar';
import { StepBarTitle } from '../components/create/step-bar-title';
import { useMobile } from '@/hooks/use-mobile-detector';
import { RoleNextButton } from '../components/next-button';
import { Button } from '@errows/design';
import { useForm } from '@tanstack/react-form';
import { cn } from '@errows/design/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCharacterApi } from '@/apis/character';
import { LoadingFace } from '../components/loading-face';
import { Step1, Step2, Step3, Step4, Step5 } from '../components/create/steps';
import { useCharacterOptions } from '../hooks/use-character-options';
import { useFieldConfig } from '../hooks/use-field-config';;
import { stepGroups } from '../constants';
import type { CreateDialogFormData } from '../types';
import { alertDialog } from '@errows/design';
import { ArrowRightIcon } from '@errows/icons';

const BOTTOM_GAP = 80

function CreateRole() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [showLoadingFace, setShowLoadingFace] = useState(false);
  const [characterData, setCharacterData] = useState<Partial<API.Character.Setting>>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMobile();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 获取角色选项配置
  const { characterOptions, groupDict, formDependsConfig } = useCharacterOptions();

  // 获取字段配置相关方法
  const { getFieldConfig } = useFieldConfig(groupDict, formDependsConfig);

  // 处理返回逻辑：如果有上一页则返回，否则导航到 /character
  const handleGoBack = () => {
    const hasFromState = location.state && typeof location.state === 'object' && 'from' in location.state;
    if (hasFromState) {
      navigate(-1);
    } else {
      navigate('/character');
    }
  };

  // 创建角色的 mutation
  const createCharacterMutation = useMutation({
    mutationFn: (data: API.Character.Setting) => createCharacterApi(data),
    onSuccess: () => {
      setShowLoadingFace(false);
      setIsSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['myCharacters'] });
      handleGoBack();
    },
    onError: () => {
      setShowLoadingFace(false);
      setIsSubmitting(false);
    },
  });

  // 表单默认值
  const defaultValues = useMemo(() => {
    const values: Partial<CreateDialogFormData> = {
      tags: [],
      gender: 'Female', // 默认选中 Female
      creationMode: 'fast',
    };
    return {
      ...values,
    } as CreateDialogFormData;
  }, []);

  // 表单实例
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const submitValue = value as CreateDialogFormData;
      setCharacterData(submitValue);
      setStep(5);
    },
  });

  // 处理保存（从表单数据转换为角色设置）
  const handleSave = () => {
    const formData = form.state.values;
    setCharacterData(formData);
  };

  // 处理摘要页提交
  const handleSummarySubmit = () => {
    // 防止重复提交：如果正在提交中，则不允许再次提交
    if (isSubmitting || !characterData) return;

    setIsSubmitting(true);
    setShowLoadingFace(true);
    const result = {
      ...characterData,
    } as Partial<API.Character.Setting>;
    if (result.tags && Array.isArray(result.tags)) {
      result.tags = (result.tags as Array<string | { value: string }>).map((tag: string | { value: string }) => typeof tag === 'string' ? tag : tag.value);
    }
    
    if (typeof result.voice === 'string') {
      result.voice = result.voice.replace(/\+/g, ' ');
    }
    createCharacterMutation.mutate(result as API.Character.Setting);
  };

  // 验证当前步骤的必填项
  const validateCurrentStep = (): { isValid: boolean; missingFields: string[] } => {
    const currentStepFields = getCurrentStepFields(step);
    const formValues = form.state.values as CreateDialogFormData;
    const missingFields: string[] = [];;

    currentStepFields.forEach((fieldKey) => {
      const fieldConfig = getFieldConfig(fieldKey, formValues);;
      if (!fieldConfig) return;

      // 根据gender 依赖判断，性别不匹配，即使是required，也不进行验证
      const gender = formValues.gender;
      const genderDepends = fieldConfig.depends?.find(item => item[0] === 'gender')?.[1];
      if (genderDepends && genderDepends.length > 0 && !genderDepends.includes(gender)) {
        return;
      }

      // 检查字段是否为必填
      if (fieldConfig.required) {
        const fieldName = fieldKey;
        const fieldValue = (formValues as Record<string, any>)[fieldName];
        // 验证字段值
        let isEmpty = false;
        if (fieldValue === undefined || fieldValue === null) {
          isEmpty = true;
        } else if (typeof fieldValue === 'string') {
          isEmpty = fieldValue.trim() === '';
        } else if (Array.isArray(fieldValue)) {
          isEmpty = fieldValue.length === 0;
        }

        if (isEmpty) {
          missingFields.push(fieldKey);
        }
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  };

  // 步骤导航
  const next = () => {
    // 验证当前步骤的必填项
    const validation = validateCurrentStep();
    if (!validation.isValid) {
      // 显示错误提示
      const errorMessage = `${t('createCharacter.fillRequiredFields')}: ${validation.missingFields.map(title=> {
        return  t(`characterOptions.titles.${title.toLowerCase()}`)
      }).join(', ')}`;
      alertDialog.error({
        title: t('createCharacter.requiredFieldsMissing'),
        content: errorMessage,
      });
      return;
    }

    handleSave();
    const nextStep = Math.min(5, step + 1);
    setStep(nextStep);
  };

  const back = () => {
    if (step === 1) { handleGoBack() }
    else setStep((s) => Math.max(1, s - 1));
  }

  // 获取当前步骤的字段列表
  const getCurrentStepFields = (stepNumber: number) => {
    return stepGroups.find(g => g.step === stepNumber)?.fields || [];
  };

  // 当步骤切换时，滚动到顶部
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  return (
    <div
      className={cn('relative w-full flex flex-col', isMobile ? 'pt-0' : 'pt-32')}
    >
      <StepBarTitle onClose={handleGoBack} />
      <StepBar step={step} isMobile={isMobile} />

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className='flex-1 overflow-y-auto scrollbar-hide flex justify-center mb-24'
      >
        <div className="flex flex-col gap-8 w-full max-w-4xl items-center">
          {step === 1 && (
            <Step1
              form={form}
              isMobile={isMobile}
              getFieldConfig={getFieldConfig}
              formDependsConfig={formDependsConfig}
            />
          )}

          {step === 2 && (
            <Step2
              form={form}
              stepFields={getCurrentStepFields(2)}
              getFieldConfig={getFieldConfig}
              formDependsConfig={formDependsConfig}
            />
          )}

          {step === 3 && (
            <Step3
              form={form}
              stepFields={getCurrentStepFields(3)}
              getFieldConfig={getFieldConfig}
              formDependsConfig={formDependsConfig}
            />
          )}

          {step === 4 && (
            <Step4
              form={form}
              stepFields={getCurrentStepFields(4)}
              getFieldConfig={getFieldConfig}
              formDependsConfig={formDependsConfig}
              isMobile={isMobile}
            />
          )}

          {step === 5 && (
            <Step5
              form={form}
              characterData={characterData}
              characterOptions={characterOptions}
            />
          )}
        </div>
      </form>

      <div className='fixed left-0 right-0 bottom-[40px] z-999 w-full flex justify-center' style={
        isMobile ? {
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 86.54%)',
          height: BOTTOM_GAP,
          alignItems: 'center',
        } : {
          left: 40,
        }}>
        <div
          className={cn("flex w-full justify-between",
            isMobile ? 'pl-2 pr-2' : 'max-w-4xl ',
            step === 1 ? 'justify-center' : 'justify-between'
          )}
        >
          {step !== 1 && <RoleNextButton onClick={back} type='pre' isMobile={isMobile}>{t('common.previous')}</RoleNextButton>
          }
          {step === 5 ?
            <Button
              appearance="gradientFill"
              className="text-white font-urbanist font-medium text-base"
              onClick={handleSummarySubmit}
              disabled={isSubmitting}
              style={{
                padding: "8px 26px"
              }}
            >
              {t('createCharacter.bringCharacterToLife')} <ArrowRightIcon />
            </Button>
            : <RoleNextButton onClick={next} isMobile={isMobile} />}
        </div>
      </div>


      {/* 加载状态浮层 */}
      <LoadingFace
        open={showLoadingFace}
        title={characterData?.nickname || t('sidebar.character')}
        statusText={t('role.create.buildingFace')}
        onClose={() => setShowLoadingFace(false)}
      />
    </div>
  );
}

export default CreateRole;
