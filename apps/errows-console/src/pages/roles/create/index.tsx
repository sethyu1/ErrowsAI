import React, { useState, useRef, useEffect } from 'react';
import { Card, Steps, Button, message, Spin, Modal } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { createCharacterApi } from '@/apis/character';
import { useCharacterOptions } from './hooks/use-character-options';
import { useFieldConfig } from './hooks/use-field-config';
import { stepGroups } from './constants';
import { shouldShowField } from './utils';
import { FieldRenderer } from './components/field-renderer';
import { CharacterPreview } from './components/character-preview';
import type { CreateDialogFormData } from './types';
import { CREATE_ROLE_DICT } from '@/constants';
import styles from './index.module.less';

const { Step } = Steps;

// 步骤配置
const steps = [
  { title: '基础信息' },
  { title: '角色属性' },
  { title: '外观特征' },
  { title: '详细设置' },
  { title: '预览提交' },
];


const RolesCreate: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<CreateDialogFormData>>({
    gender: 'Male', // 默认选择男性
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const formContentRef = useRef<HTMLDivElement>(null);

  // 获取角色选项配置
  const { characterOptions, groupDict, formDependsConfig, loading: optionsLoading } = useCharacterOptions();
  const { getFieldConfig } = useFieldConfig(groupDict, formDependsConfig);

  // 当步骤变化时，滚动到顶部
  useEffect(() => {
    if (formContentRef.current) {
      formContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // 也可以使用 window.scrollTo 滚动整个页面
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // 更新表单值
  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
  };

  // 验证当前步骤
  const validateCurrentStep = () => {
    const currentFields = stepGroups[currentStep]?.fields || [];

    for (const fieldKey of currentFields) {
      const fieldConfig = getFieldConfig(fieldKey, formData);

      // 跳过不存在的字段配置
      if (!fieldConfig) continue;

      // 检查字段是否应该显示（根据依赖条件，如性别）
      if (!shouldShowField(fieldConfig, formData)) {
        continue;
      }

      // 只校验应该显示且必填的字段
      if (fieldConfig.required && !formData[fieldKey]) {
        message.warning(`请填写必填项: ${CREATE_ROLE_DICT.titles[fieldKey as keyof typeof CREATE_ROLE_DICT.titles] || fieldConfig.title}`);
        return false;
      }
    }
    return true;
  };

  // 下一步
  const handleNext = () => {
    const isValid = validateCurrentStep();
    if (!isValid) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 上一步
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 提交
  const handleSubmit = async () => {
    if (submitting) return;

    const isValid = validateCurrentStep();
    if (!isValid) return;

    setSubmitting(true);

    try {
      const finalData = { ...formData };

      // 处理 tags
      if (finalData.tags && Array.isArray(finalData.tags)) {
        finalData.tags = finalData.tags.map((tag: any) =>
          typeof tag === 'string' ? tag : tag.value
        );
      }

      await createCharacterApi(finalData as API.Character.Setting);
      message.success('角色创建成功！');
      navigate('/roles/list');
    } catch (error: any) {
      console.error('Failed to create character:', error);
      message.error(`角色创建失败: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // 重新创建
  const handleReset = () => {
    Modal.confirm({
      title: '确认重新创建？',
      content: '这将清空所有已填写的信息，并返回到第一步。是否继续？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        // 重置表单数据，保留默认性别
        setFormData({ gender: 'Male' });
        // 返回第一步
        setCurrentStep(0);
        message.info('已重置表单');
      },
    });
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    if (optionsLoading || !characterOptions) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>加载配置中...</div>
        </div>
      );
    }

    // 如果是最后一步（预览），显示预览组件
    if (currentStep === steps.length - 1) {
      return (
        <div className={styles.stepContent}>
          <CharacterPreview data={formData} groupDict={groupDict} />
        </div>
      );
    }

    const currentFields = stepGroups[currentStep]?.fields || [];

    return (
      <div className={styles.stepContent}>
        {currentFields.map((fieldKey) => {
          const fieldConfig = getFieldConfig(fieldKey, formData);
          if (!fieldConfig) return null;

          return (
            <FieldRenderer
              key={fieldKey}
              fieldConfig={fieldConfig}
              value={formData[fieldKey]}
              onChange={(value) => handleFieldChange(fieldKey, value)}
              formValues={formData}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>

        <div className={styles.pageTitle} ref={formContentRef}>
          创建我的 AI 角色
        </div>

        <Steps current={currentStep} className={styles.steps}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} />
          ))}
        </Steps>

        <div className={styles.form}>
          {renderStepContent()}
        </div>

        <div className={styles.actions} style={currentStep === 0 ? { justifyContent: 'center' } : {}}>
          {currentStep > 0 && currentStep <= steps.length - 1 && (
            <Button size="large" onClick={handlePrev}>
              上一步
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              一键重置
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" size="large" onClick={handleNext} icon={<ArrowRightOutlined />}>
              下一步
            </Button>
          )}
          {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                loading={submitting}
              >
                创建角色
              </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RolesCreate;
