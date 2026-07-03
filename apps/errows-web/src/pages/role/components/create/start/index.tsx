import girlUrl from '@/assets/girl.webp';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@errows/design';
import { CreateGuideDialog } from './guide-dialog';
import { MagicWandIcon } from "@errows/icons";
import { ArrowRightIcon } from '@errows/icons'
import { useMobile } from '@/hooks/use-mobile-detector';
import { cn } from '@errows/design/lib/utils';

export function Start() {
  const { t } = useTranslation();
  const isMobile = useMobile()
  const [guideOpen, setGuideOpen] = useState(false);
  const navigate = useNavigate();


  return (
    <>
      <div className={cn('flex flex-col items-center', isMobile ? 'mt-15' : 'mt-[23px]')}>
        {/* 标题 */}
        <h2 className={cn(
          "font-bold font-urbanist  leading-[22px] text-center text-[#FCFCFC]",
          isMobile ? 'text-2xl' : 'text-[32px]'
        )}>
          {t('createCharacter.noCharactersYet')}
        </h2>

        {/* 中间图片 */}
        <img
          src={girlUrl}
          alt={t('createCharacter.createRolePreview')}
          className="mt-[38px] w-[294px] h-[454px] rounded-[23px] object-cover"
        />

        {/* 按钮：使用设计库导出的 Button */}
        <div className="mt-[38px]">
          <Button
            appearance="gradientFill"
            className="w-[294px] h-[38px]"
            onClick={() => navigate('/role/create')}
          >
            {t('common.createNew')}  <ArrowRightIcon />
          </Button>
        </div>

        {/* 底部触发器 */}
        <div
          className="mt-[14px] h-[38px] px-4 py-2 flex items-center justify-center gap-[6px] cursor-pointer"
          onClick={() => setGuideOpen(true)}
        >
          <span className="font-bold text-[14px] leading-[38px] text-center text-[#F5F5F5]">{t('createCharacter.howToCreate')}</span>
          <MagicWandIcon className="w-[12px] h-[12px] text-[#F5F5F5]" />
        </div>
      </div>

      {/* 受控弹框 */}
      <CreateGuideDialog open={guideOpen} isMobile={isMobile}  onOpenChange={setGuideOpen} />
    </>
  );
}
