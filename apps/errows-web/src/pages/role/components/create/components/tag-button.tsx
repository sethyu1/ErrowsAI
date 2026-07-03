import React from 'react';
import { cn } from '@errows/design/lib/utils';

export interface TagButtonProps {
  /** 标签文本 */
  children: React.ReactNode;
  /** 是否选中 */
  selected?: boolean;
  /** 是否禁用（达到最大选择数量时） */
  disabled?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 标签按钮组件
 * 用于标签选择器
 * 
 * 选中状态：透明背景（或匹配主背景），更粗的白色边框（2px），浅灰色文字
 * 未选中状态：深灰色背景，细的浅灰色边框（1px），浅灰色文字
 */
export function TagButton({ 
  children, 
  selected = false,
  disabled = false,
  onClick,
  className 
}: TagButtonProps) {
  // 已选中的标签总是可以点击（用于取消选择），不受 disabled 影响
  const isActuallyDisabled = disabled && !selected;
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isActuallyDisabled}
      className={cn(
        'px-4 py-2 rounded-full cursor-pointer text-sm font-bold text-[#FCFCFC] transition-all duration-200 bg-[#1D1E27] ',
        'font-urbanist',
        // 禁用状态的样式
        isActuallyDisabled && 'opacity-50 cursor-not-allowed',
        // 选中状态：透明背景，2px 白色边框
        selected
          ? 'bg-transparent border-2 border-white'
          : // 未选中状态：深灰色背景，1px 浅灰色边框
            'border border-[#2C2C38]',
        className
      )}
      aria-pressed={selected}
    >
      {children}
    </button>
  );
}

