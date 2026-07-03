import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon, ArrowLeftIcon } from '@errows/icons';
import { cn } from '@errows/design/lib/utils';

export interface RoleNextButtonProps {
  /** 是否移动端 */
  isMobile?: boolean
  /** 按钮文本，默认为 "Next" */
  children?: React.ReactNode;
  type?: 'pre' | 'next'
  /** 点击回调 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 创建角色下一步按钮组件
 * @example
 * <NextButton onClick={() => handleNext()} />
 */
export function RoleNextButton({
  children,
  type='next',
  onClick,
  className,
  style,
}: RoleNextButtonProps) {
  const { t } = useTranslation();
  const defaultText = type === 'pre' ? t('common.previous') : t('common.next');
  const buttonText = children || defaultText;
  const isPre = type === 'pre';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full cursor-pointer',
        'flex items-center justify-center gap-2',
        'font-urbanist font-[700] text-base',
        'transition-all duration-200',
        'hover:shadow-lg active:scale-95',
        'w-[144px] h-[38px]',
        className
      )}
      style={{
        color: isPre ? '#FCFCFC' : '#090A0A',
        background: isPre ? '#1D1E27' : 'linear-gradient(215.79deg, #D9D9D9 25.96%, #D6B8D4 91.04%)',
        ...style,
      }}
    >
      {isPre && <ArrowLeftIcon className="w-4 h-4" />}
      <span>{buttonText}</span>
      {!isPre &&<ArrowRightIcon className="w-4 h-4" />}
    </button>
  );
}

