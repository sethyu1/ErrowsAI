import React from 'react';
import { useTranslation } from 'react-i18next';
import { BackIcon, CloseIcon } from '@errows/icons';
import { useMobile } from '@/hooks/use-mobile-detector';

export interface StepBarTitleProps {
  style?: React.CSSProperties;
  onClose?: () => void;
}

export function StepBarTitle({ onClose, style = {} }: StepBarTitleProps) {
  const { t } = useTranslation();
  const isMobile = useMobile();

  return (
    <div
      className="w-full flex items-center"
      style={
        isMobile
          ? {
            padding: '20px 24px',
            background: 'linear-gradient(180deg, #0E0E15 -27.08%, rgba(0, 0, 0, 0) 100%)',
            boxShadow: '0px -1px 0px 0px #FFA8F91F inset',
            ...style
          }
          : {
            ...style
          }
      }
    >
      {
        isMobile && <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex items-center justify-center text-white cursor-pointer"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      }
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4">
        {!isMobile && <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="flex items-center justify-center text-white cursor-pointer"
        >
          <BackIcon className="w-6 h-6" />
        </button>
        }

        {/* 中央标题 + 模式徽标（紧跟标题右上角） */}
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-flex items-start">
            <h1
              className="text-white text-center font-urbanist font-[700]"
              style={{
                lineHeight: '28px',
                fontSize: '22px', // Title Large 视觉等效
              }}
            >
              {t('createCharacter.createMyAICharacter')}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}


