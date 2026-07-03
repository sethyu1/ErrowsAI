import React from 'react';
import { Space } from 'antd';
import { PillButton } from '../pill-button';
import { CREATE_ROLE_DICT } from '@/constants';

export interface GenderOption {
  value: string;
  prompt?: string;
}

export interface PillButtonSelectorProps {
  /** 当前选中值 */
  value?: string;
  /** 选择变化回调 */
  onChange?: (value: string) => void;
  /** 选项列表 */
  options?: GenderOption[];
}

/**
 * 胶囊按钮选择器组件
 */
export function PillButtonSelector({ value, onChange, options = [] }: PillButtonSelectorProps) {
  return (
    <Space size="middle">
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <PillButton
            key={option.value}
            selected={isSelected}
            onClick={() => onChange?.(option.value)}
          >
            {CREATE_ROLE_DICT.labels[option.value as keyof typeof CREATE_ROLE_DICT.labels] || option.prompt || option.value}
          </PillButton>
        );
      })}
    </Space>
  );
}

