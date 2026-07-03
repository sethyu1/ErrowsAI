import React from 'react';
import { cn } from '@errows/design/lib/utils';

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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-6 py-2 rounded-full text-sm cursor-pointer font-urbanist',
        // 选中状态：白色背景，黑色文字
        selected
          ? 'bg-white text-[#090A0A]'
          : // 未选中状态：深灰色背景，白色文字
            'bg-[#2C2C38] text-white hover:bg-[#3A3A48]',
        className
      )}
      aria-pressed={selected}
    >
      {children}
    </button>
  );
}

