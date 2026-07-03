import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from '@errows/design/components/dialog';
import { Coins } from './coins';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CoinsDialogProps extends React.ComponentProps<typeof Dialog> {}

export function CoinsDialog(props: CoinsDialogProps) {
  const { t } = useTranslation();
  
  return (
    <Dialog {...props}>
      <DialogContent
        className="w-135 z-1050 p-0 rounded-2xl overflow-hidden bg-[rgba(30,26,39,1)]"
        style={{
          border: '1px solid rgba(255, 255, 255, 10%)',
          backgroundColor: 'rgba(27,18,39,1)',
        }}
      >
        <DialogHeader className=''>
          <DialogTitle className="text-center pt-6">
            {t('auth.getMoreCoins')}
          </DialogTitle>
        </DialogHeader>

        <Coins />
      </DialogContent>
    </Dialog>
  )
}
