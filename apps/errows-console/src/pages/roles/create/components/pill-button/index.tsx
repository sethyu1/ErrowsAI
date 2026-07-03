import React from 'react';
import { Button } from 'antd';
import styles from './index.module.less';

export interface PillButtonProps {
  /** 按钮文本 */
  children: React.ReactNode;
  /** 是否选中 */
  selected?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * Pill 形状按钮组件
 */
export function PillButton({ 
  children, 
  selected = false, 
  onClick,
  className 
}: PillButtonProps) {
  return (
    <Button
      type={selected ? 'primary' : 'default'}
      onClick={onClick}
      className={`${styles.pillButton} ${selected ? styles.selected : ''} ${className || ''}`}
      size="large"
    >
      {children}
    </Button>
  );
}

