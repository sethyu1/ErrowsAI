import React from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@errows/design/lib/utils';

export interface LoadingSpinnerProps {
  /** 图标尺寸（宽度和高度） */
  size?: number | string;
  /** 图标颜色 */
  color?: string;
  /** 旋转速度（秒） */
  speed?: number;
  /** 自定义类名 */
  className?: string;
  /** 图标名称 */
  icon?: string;
}

/**
 * 加载中旋转图标组件
 * 用于显示加载状态，支持自定义速度和尺寸
 */
export function LoadingSpinner({
  size = 64,
  color = 'white',
  speed = 2,
  className,
  icon = 'streamline-ultimate:loading',
}: LoadingSpinnerProps) {
  return (
    <Icon
      icon={icon}
      className={cn('text-white', className)}
      width={size}
      height={size}
      color={color}
      style={{
        animation: `spin ${speed}s linear infinite`,
      }}
    />
  );
}

