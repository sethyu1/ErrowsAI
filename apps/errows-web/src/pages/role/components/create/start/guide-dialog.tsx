import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@errows/design';
import { useTranslation } from 'react-i18next';
import { Badge } from './badge';
import { Step } from './step'

export interface CreateGuideDialogProps {
  open: boolean;
  isMobile: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateGuideDialog({ open, onOpenChange, isMobile }: CreateGuideDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={isMobile
          ? { maxWidth: 'unset', transform: 'unset', translate: 'unset', zIndex: 9999 }
          : { maxHeight: '90vh', overflowY: 'auto' }
        }
        className={isMobile
          ? 'top-0 bottom-0 left-0 right-0 w-full h-full overflow-y-auto scrollbar-hide mb-30'
          : 'flex flex-col max-h-[90vh] max-w-[calc(100%-28rem)] overflow-hidden'
        }
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <DialogHeader className="shrink-0">
            <DialogTitle
              className="text-[22px] leading-[28px] font-medium text-[#FFFFFF] text-left"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              {t('createCharacter.stepsToCreateCharacter')}
            </DialogTitle>
          </DialogHeader>

          {/* 右上角 Roadmap 圆形徽章 */}
          {!isMobile && <div
            className="absolute top-6 right-6"
          >
            <Badge />
          </div>
          }

          {/* 步骤列表 */}
          <div className="mt-[10px] flex flex-col gap-6">
            {/* Step 1 */}
            <div className="flex items-start gap-6 border border-white/15 rounded-[23px] p-6">
              <Step>01.</Step>
              <div className="flex-1">
                <div className="text-[#F5F5F5] font-semibold text-[22px] leading-[30px]">{t('createCharacter.defineWorldRole')}</div>
                <div className="text-[#C9C9C9] text-[16px] leading-[24px]">
                  {t('createCharacter.defineWorldRoleDesc')}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-6 border border-white/15 rounded-[23px] p-6">
              <Step>02.</Step>
              <div className="flex-1">
                <div className="text-[#F5F5F5] font-semibold text-[22px] leading-[30px]">{t('createCharacter.designCoreAppearance')}</div>
                <div className="text-[#C9C9C9] text-[16px] leading-[24px]">
                  {t('createCharacter.designCoreAppearanceDesc')}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-6 border border-white/15 rounded-[23px] p-6">
              <Step>03.</Step>
              <div className="flex-1">
                <div className="text-[#F5F5F5] font-semibold text-[22px] leading-[30px]">{t('createCharacter.addStoryPersonality')}</div>
                <div className="text-[#C9C9C9] text-[16px] leading-[24px]">
                  {t('createCharacter.addStoryPersonalityDesc')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-4 flex justify-center shrink-0">
          <DialogClose asChild>
            <Button className="w-[240px] rounded-[100px] bg-errows-gradient-secondary text-[#0A0B0F] font-semibold">{t('createCharacter.gotIt')}</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateGuideDialog;

