import React from 'react';
import { Tag } from 'antd';
import styles from './index.module.less';

export interface TagButtonProps {
  /** 标签文本 */
  children: React.ReactNode;
  /** 是否选中 */
  selected?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 标签按钮组件
 */
export function TagButton({ 
  children, 
  selected = false,
  disabled = false,
  onClick,
  className 
}: TagButtonProps) {
  const isActuallyDisabled = disabled && !selected;
  
  return (
    <Tag
      onClick={isActuallyDisabled ? undefined : onClick}
      className={`${styles.tagButton} ${selected ? styles.selected : ''} ${isActuallyDisabled ? styles.disabled : ''} ${className || ''}`}
      style={{ cursor: isActuallyDisabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </Tag>
  );
}

