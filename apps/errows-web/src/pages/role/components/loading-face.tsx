import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';
import { CloseIcon } from '@errows/icons';
import { LoadingSpinner } from './loading-spinner';

export interface LoadingFaceProps {
  /** 是否显示 */
  open?: boolean;
  /** 加载文本提示（如角色名称） */
  title?: string;
  /** 加载状态文本（如 "Building Face"） */
  statusText?: string;
  /** 自定义类名 */
  className?: string;
  /** 旋转速度（秒） */
  spinnerSpeed?: number;
  /** 图标尺寸 */
  spinnerSize?: number;
  /** 关闭按钮点击回调 */
  onClose?: () => void;
}

/**
 * 角色生成过程中的全局加载 Face 组件
 * 严格按照 Figma 设计实现
 * 
 * 设计规格：
 * - 浮层形式，整体居中显示
 * - 遮罩层阻止底层交互
 * - Loading 卡片：
 *   - width: 364px
 *   - height: 96px
 *   - background: #1B1227
 *   - border: 1px solid #FFFFFF4D (rgba(255, 255, 255, 0.3))
 *   - 内部 padding: 16px
 *   - 右上角关闭按钮
 *   - LoadingSpinner 大小: 33px
 *   - 文字距离左侧 loading: 30px
 */
export function LoadingFace({
  open = false,
  title,
  statusText,
  className,
  spinnerSpeed = 2,
  spinnerSize = 33,
  onClose,
}: LoadingFaceProps) {
  const { t } = useTranslation();
  const defaultStatusText = statusText || t('role.create.buildingFace');
  if (!open) return null;

  return (
    <>
      {/* 遮罩层 - 阻止底层交互 */}
      <div
        className="fixed inset-0 z-[9999] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Loading 内容 - 居中显示 */}
      <div
        className={cn(
          'fixed left-1/2 top-1/2 z-[10000] rounded-2xl flex flex-col',
          '-translate-x-1/2 -translate-y-1/2',
          className
        )}
        style={{
          width: '364px',
          height: '96px',
          background: '#1B1227',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '16px',
        }}
      >
        {/* 右上角关闭按钮 */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded transition-colors z-10"
            aria-label="关闭"
          >
            <CloseIcon className="w-[13px] h-[13px] text-white" />
          </button>
        )}

        {/* 加载动画容器 - 横向布局 */}
        <div className="flex items-center h-full">
          {/* 旋转的加载图标 - 使用 LoadingSpinner */}
          <div
            style={{
              filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
            }}
          >
            <LoadingSpinner
              size={spinnerSize}
              speed={spinnerSpeed}
            />
          </div>

          {/* 文字信息 - 距离左侧 loading 30px */}
          <div className="flex flex-col text-white" style={{ marginLeft: '30px' }}>
            {title && (
              <div className="font-urbanist font-medium text-base mb-0.5">
                {title}
              </div>
            )}
            <div className="font-urbanist font-normal text-sm text-gray-400">
              {defaultStatusText}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

