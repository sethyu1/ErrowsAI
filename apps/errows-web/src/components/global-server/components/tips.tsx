import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from '@errows/design/components/dialog';
import { Button } from '@errows/design/components/button';
import { ArrowRightIcon } from '@errows/icons'

interface TipsProps extends React.ComponentProps<typeof Dialog> {
  onExit?: () => void;
  onConfirm?: () => void;
}

export function Tips(props: TipsProps) {
  const { onExit, onConfirm, ...rest } = props;
  const { t } = useTranslation();

  return (
    <Dialog {...rest}>
      <DialogContent
        className="w-120 rounded-2xl [&>button]:hidden overflow-hidden bg-[rgba(30,26,39,1)]"
        style={{
          border: '1px solid rgba(255, 255, 255, 10%)',
          backgroundColor: 'rgba(27,18,39,1)',
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {t('auth.tips')}
          </DialogTitle>
        </DialogHeader>

        <div>
          <div className="text-sm leading-6 text-[#A1A8A8]">
            {t('auth.tipDesc')}
          </div>
          <div className="flex mt-8 justify-center">
            <div className="flex w-full gap-3">
              <Button
                className="cursor-pointer flex-1"
                variant="outline"
                shape="round"
                onClick={onExit}
              >
                <span>{t('auth.tipClose')}</span>
                <ArrowRightIcon className="rotate-180" />
              </Button>

              <Button
                className="cursor-pointer flex-1"
                appearance="gradientFill"
                shape="round"
                onClick={onConfirm}
              >
                <span>{t('auth.tipConfirm')}</span>
                <ArrowRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
