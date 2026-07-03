import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';
import { CheckMarkIcon } from '@errows/icons';
import { Button } from '@errows/design';

export interface RoleImageCardProps {
  /** 是否移动端 */
  isMobile?: boolean
  /** 图片地址 */
  imageUrl?: string;
  /** 姓名 */
  name: string;
  /** 是否选中 */
  selected?: boolean;
  /** noShadow */
  noShadow?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否锁定 */
  locked?: boolean;
  /** 解锁 */
  onUnlock?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 卡片尺寸：'large' 240x287px 或 'small' 113x135px */
  size?: 'large' | 'small';
  /** 自定义样式 */
  style?: React.CSSProperties;
}

const sizeConfig = {
  pc: {
    large: {
      width: 240,
      height: 287,
      borderRadius: 16,
    },
    small: {
      width: 113,
      height: 135,
      borderRadius: 8,
    },
  },

  mobile: {
    large: {
      width: window.innerWidth <= 380 ? 164 : 178.54,
      height: 213.5,
      borderRadius: 11.9,
    },
    small: {
      width: window.innerWidth <= 380 ? 104 : 114,
      height: 135,
      borderRadius: 8,
    },
  }
}

/**
 * 响应式图片卡片组件
 * 支持点击和选中状态，适配移动设备
 * 根据 Figma 设计：选中态为白色发光边框，未选中为深灰色边框
 * 标签在底部覆盖层内，对勾在标签右下角
 */
export function RoleImageCard({
  imageUrl,
  name,
  selected = false,
  className,
  size = 'large',
  locked = false,
  isMobile = false,
  style = {},
  onClick,
  onUnlock,
}: RoleImageCardProps) {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    onClick?.();
  };

  // 根据尺寸设置样式
  const sizeStyles = isMobile ? sizeConfig.mobile : sizeConfig.pc;

  const currentSize = sizeStyles[size];

  const isMini = window.innerWidth <= 380;

  if (isMini && size === 'small') currentSize.width = 104

  const roundedClass = size === 'large' ? 'rounded-2xl' : 'rounded-lg';

  return (
    <div
      className={cn(
        // 基础样式
        'relative cursor-pointer transition-all grow-0 duration-200 rounded-lg border-2 box-content',
        'hover:scale-[1.01] active:scale-[1.01]',
        roundedClass,
        selected ? 'border-white' : 'border-transparent',
        className
      )}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{
        width: currentSize.width,
        height: currentSize.height,
        ...style,
      }}
    >
      {/** 深色渐变背景 */}
      <div className='absolute w-full h-full left-0 top-0 right-0 bottom-0 rounded-lg z-1'
        style={{
          background: 'linear-gradient(360deg, rgba(0, 0, 0, 0.6) 3.44%, rgba(0, 0, 0, 0) 27.48%)',
        }}
      />
      {/* 选中状态指示器 - 右侧对齐，与文字垂直对齐 */}
      {selected && (
        <div
          className="absolute right-2 top-2 z-1 flex items-center justify-center font-[700] z-3"
          style={{
            width: size === 'large' ? 24 : 14,
            height: size === 'large' ? 24 : 14,
            fontSize: size === 'large' ? 16 : 10,
            borderRadius: '50%',
            backgroundColor: '#fff',
            color: '#0E0F17'
          }}
        >
          <CheckMarkIcon className={size === 'large' ? 'size-3' : 'size-2'} />
        </div>
      )}
      {/* 图片容器 */}
      <div
        className={cn(
          'relative w-full h-full overflow-hidden box-content border-1',
          roundedClass,
          selected ? 'border-black' : 'border-transparent'
        )}
      >
        {/* 加载占位符 */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse" />
        )}

        {/* 错误占位符 */}
        {imageError && (
          <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 text-sm">{t('common.imageFailed')}</span>
          </div>
        )}

        {/* 图片 */}
        <img
          src={imageUrl}
          alt={name}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300 hover:scale-[1.05] active:scale-[1.05]',
            roundedClass,
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          loading="lazy"
        />

        {locked && (
          <Button
            className="absolute bottom-[40px] font-[700] font-urbanist text-white left-0 right-0"
            appearance="gradientFill" size="sm" shape="round"
            style={{
              margin: '0 auto',
              // width: 56,
              paddingLeft: 8,
              paddingRight: 8,
              fontSize: 10,
              lineHeight: 22,
              width: 64,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onUnlock?.();
            }}>{t('common.unlock')}</Button>
        )}
        {/* 底部标签覆盖层 */}
        {name && <div
          className={cn(
            'absolute bottom-0 left-0 w-full right-0 flex items-center justify-center z-4',
            roundedClass,
            size === 'large'
              ? 'pt-3 pb-3 px-1 min-h-[48px]'
              : 'pt-2 pb-2 px-2 min-h-9',
            selected ? 'font-[600]' : 'font-normal'
          )}
          style={{
            transform: 'translateY(2px)',
          }}
        >
          {/* 标签文字 - 绝对居中 */}
          <span
            className={cn(
              'text-white line-clamp-1 text-center',
              'font-urbanist',
              size === 'large' ? 'text-[15.31px] leading-[21.05px]' : 'text-xs leading-4'
            )}
            style={{
              maxWidth: 86
            }}
          >
            {name}
          </span>
        </div>
        }
      </div>
    </div>
  );
}

