import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';
import { Icon } from '@iconify/react';

export interface LoadingCardProps {
  /** 加载文本提示（如角色名称） */
  title?: string;
  /** 加载状态文本（如 "Building Face"） */
  statusText?: string;
  /** 是否选中/高亮 */
  selected?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 卡片尺寸 */
  size?: 'large' | 'small';
}

/**
 * 加载中卡片组件
 * 严格按照 Figma 设计实现
 * 用于显示角色生成中的加载状态
 */
export function LoadingCard({
  title,
  statusText,
  selected = false,
  className,
  size = 'large',
}: LoadingCardProps) {
  const { t } = useTranslation();
  const defaultStatusText = statusText ?? t('createCharacter.buildingFace');
  // 根据尺寸设置样式
  const sizeStyles = {
    large: {
      width: '240px',
      height: '287px',
      borderRadius: '16px',
    },
    small: {
      width: '113px',
      height: '135px',
      borderRadius: '8px',
    },
  };

  const currentSize = sizeStyles[size];
  const iconSize = size === 'large' ? 64 : 32;
  const titleSize = size === 'large' ? 'text-base' : 'text-sm';
  const statusSize = size === 'large' ? 'text-sm' : 'text-xs';

  return (
    <div
      className={cn(
        'relative overflow-hidden flex flex-col items-center justify-center',
        'bg-[#1D1E27]',
        // 边框样式 - 选中态蓝色边框，未选中深灰色边框
        selected
          ? 'border-2 border-blue-400'
          : 'border border-[#2C2C38]',
        className
      )}
      style={{
        width: currentSize.width,
        height: currentSize.height,
        borderRadius: currentSize.borderRadius,
      }}
    >
      {/* 加载动画容器 */}
      <div className="flex flex-col items-center justify-center px-4">
        {/* 旋转的加载图标 */}
        <Icon
          icon="mdi:loading"
          className="text-white animate-spin mb-4"
          width={iconSize}
          height={iconSize}
          style={{
            filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
          }}
        />

        {/* 文字信息 */}
        <div className="text-white text-center w-full">
          {title && (
            <div className={cn('font-urbanist font-medium mb-1', titleSize)}>
              {title}
            </div>
          )}
          <div className={cn('font-urbanist font-normal text-gray-400', statusSize)}>
            {defaultStatusText}
          </div>
        </div>
      </div>
    </div>
  );
}

