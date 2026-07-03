import type { ReactNode } from 'react';
import { cn } from '@errows/design/lib/utils';
import { NPlayerIcon, NImageIcon } from '@errows/icons';

export interface MediaTagProps {
  /** 媒体类型 */
  type: 'image' | 'video';
  /** 数量 */
  count: number;
  /** 自定义图标 */
  icon?: ReactNode;
}

/**
 * 媒体标签组件
 */
export function MediaTag({ type, count, icon }: MediaTagProps) {
  // 根据 type 确定默认图标
  const DefaultIcon = type === 'video' ? NPlayerIcon : NImageIcon;

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center gap-1',
        'px-2 py-1',
        'text-base',
        'bg-black/30',
        'text-white'
      )}
      style={{ 
        borderRadius: '18px',
        backdropFilter: 'blur(4px)'
      }}
    >
      {/* 图标部分 */}
      <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-white">
        {icon ? (
          icon
        ) : (
          <DefaultIcon className="w-4 h-4" />
        )}
      </div>

      {/* 计数部分 */}
      <span
        className={cn(
          'font-urbanist',
          'font-[700]',
          'text-xs',
          'leading-none',
          'text-white/85'
        )}
      >
        {count}
      </span>
    </div>
  );
}

