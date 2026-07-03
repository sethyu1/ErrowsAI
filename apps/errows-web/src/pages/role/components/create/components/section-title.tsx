import React, { useState } from 'react';
import { cn } from '@errows/design/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@errows/design';
import { MessageCircleQuestion } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile-detector';

export interface SectionTitleProps {
  /** 标题文本 */
  children: React.ReactNode;
  /** 右侧辅助文字（如选中颜色名称） */
  rightText?: string;
  /** 是否居中 */
  center?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否没有间距 */
  mg0?: boolean;
  /** 提示 */
  tooltip?: string;
}

/**
 * 表单区块标题组件
 * 统一的标题样式，支持左侧标题和右侧辅助文字
 * 当 center=true 且有 rightText 时，标题居中，右侧文字在右上角
 */
export function SectionTitle({
  children,
  rightText,
  center = false,
  mg0 = false,
  className,
  tooltip
}: SectionTitleProps) {
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);

  // 如果居中且有右侧文字，需要使用特殊布局
  if (center && rightText) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center mb-4 w-full',
          mg0 && 'mb-0',
          className
        )}
      >
        <h2 className="text-white text-sm font-normal font-urbanist text-center flex items-center justify-center gap-2">
          {children}
          {tooltip && (
            <Popover modal={isMobile} open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <div
                  className='cursor-pointer transition-opacity duration-150 hover:opacity-80'
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                  }}
                  onMouseEnter={() => !isMobile && setIsOpen(true)}
                  onMouseLeave={() => !isMobile && setIsOpen(false)}
                >
                  <MessageCircleQuestion className="w-4 h-4 text-gray-400" />
                </div>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="top"
                className="p-3 max-w-sm"
                onMouseEnter={() => !isMobile && setIsOpen(true)}
                onMouseLeave={() => !isMobile && setIsOpen(false)}
              >
                <div className="text-gray-400 text-sm text-justify font-urbanist whitespace-normal break-words leading-relaxed">
                  {tooltip}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </h2>
        <span className="absolute right-2 text-white text-xs font-urbanist font-bold">
          {rightText}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center mb-4',
        center ? 'justify-center' : 'justify-between',
        className
      )}
    >
      <h2 className={cn(
        'text-white text-sm font-bold font-urbanist flex items-center',
        center && 'text-center'
      )}>
        {children}
        {tooltip && (
          <Popover modal={isMobile} open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <div
                className='ml-2 cursor-pointer transition-opacity duration-150 hover:opacity-80'
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                onMouseEnter={() => !isMobile && setIsOpen(true)}
                onMouseLeave={() => !isMobile && setIsOpen(false)}
              >
                <MessageCircleQuestion className="w-4 h-4 text-gray-400" />
              </div>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              className="p-3 max-w-sm"
              onMouseEnter={() => !isMobile && setIsOpen(true)}
              onMouseLeave={() => !isMobile && setIsOpen(false)}
            >
              <div className="text-gray-400 text-sm text-justify font-urbanist whitespace-normal break-words leading-relaxed">
                {tooltip}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </h2>
      {rightText && (
        <span className="text-white text-xs font-urbanist font-bold ml-4">
          {rightText}
        </span>
      )}
    </div>
  );
}

