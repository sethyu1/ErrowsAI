import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BackIcon, CloseIcon } from '@errows/icons';
import { useMobile } from '@/hooks/use-mobile-detector';
import { TEXT_GRADUAL_STYLE } from '@/config';

export interface StepBarTitleProps {
  title?: string
  subTitle?: string
  /** Basic / Advanced 展示 */
  mode?: string
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 返回上一步 */
  onBack?: () => void;
  /** 关闭（返回上一个路由）*/
  onClose?: () => void;
}

/**
 * 顶部标题栏（移动端有渐变背景与内边距）
 */
export function BarTitle({ title, mode, subTitle, onClose, style = {} }: StepBarTitleProps) {
  const { t } = useTranslation();
  const isMobile = useMobile();
  const defaultTitle = useMemo(() => title || t('barTitle.aiHentaiGenerator'), [title, t]);
  const isAdvanced = mode === t('common.advanced');

  return (
    <div
      className="w-full flex flex-col items-center "
      style={
        isMobile
          ? {
            padding: '20px 0',
            background: 'linear-gradient(180deg, #0E0E15 -27.08%, rgba(0, 0, 0, 0) 100%)',
            boxShadow: '0px -1px 0px 0px #FFA8F91F inset',
            ...style
          }
          : {
            ...style
          }
      }
    >
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4">
        <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="flex items-center justify-center text-white cursor-pointer"
        >
          <BackIcon className="w-5 h-5" />
        </button>

        {/* 中央标题 + 模式徽标（紧跟标题右上角） */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <h1
            className="text-center font-urbanist font-[700] whitespace-nowrap flex items-center justify-center gap-2"
            style={{
              lineHeight: isMobile ? '22px' : '28px',
              fontSize: isMobile ? '16px' : '22px',
            }}
          >
            <span className="text-white">{defaultTitle}</span>
            {isAdvanced && (
              <span
                className="font-urbanist font-[700]"
                style={{
                  lineHeight: isMobile ? '22px' : '28px',
                  fontSize: isMobile ? '16px' : '22px',
                  ...TEXT_GRADUAL_STYLE,
                }}
              >
                {t('common.advanced')}
              </span>
            )}
          </h1>
        </div>

        {/* 右侧关闭 */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex items-center justify-center text-white cursor-pointer"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
      {subTitle && <div className='flex justify-center items-center mt-2'>
        <span className='font-urbanist font-[700] text-sm'
          style={TEXT_GRADUAL_STYLE}>{subTitle}</span></div>}
    </div>
  );
}


