import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PillButton } from './pill-button';

export interface GenderOption {
  value: string;
  prompt?: string;
}

export interface PillButtonSelectorProps {
  /** 当前选中值 */
  value?: API.Common.Gender;
  /** 选择变化回调 */
  onChange?: (value: API.Common.Gender) => void;
  /** 选项列表（从 characterOptions 传入） */
  options?: GenderOption[];
}

/**
 * 胶囊按钮选择器组件
 * 使用 pill-shaped 按钮显示选项
 * 使用通用的 PillButton 组件
 */
export function PillButtonSelector({ value, onChange, options }: PillButtonSelectorProps) {
  const { t } = useTranslation();
  // 如果没有传入选项，使用默认选项
  const defaultOptions: GenderOption[] = useMemo(
    () => [
      { value: 'Female', prompt: t('common.female') },
      { value: 'Male', prompt: t('common.male') },
    ],
    [t]
  );
  const genderOptions = options || defaultOptions;

  return (
    <div className="flex items-center justify-center gap-2">
      {genderOptions.map((option) => {
        const optionValue = option.value as API.Common.Gender;
        const isSelected = value === optionValue;

        return (
          <PillButton
            key={option.value}
            selected={isSelected}
            onClick={() => onChange?.(optionValue)}
          >
            {option.prompt || option.value}
          </PillButton>
        );
      })}
    </div>
  );
}

