import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogHeader,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@errows/design/components/dialog';
import { Button } from '@errows/design/components/button';
import { CheckCircleFilledIcon, CloseCircleFilledIcon } from '@errows/icons';

interface NotificationProps extends React.ComponentProps<typeof Dialog> {
  type?: 'success' | 'error';
  title?: string;
  description?: React.ReactNode;
}

export function Notification(props: NotificationProps) {
  const { type = 'success', title, description } = props;
  const { t } = useTranslation();

  return (
    <Dialog {...props}>
      <DialogContent
        className="[&>button]:hidden w-90 pb-4 pt-9 z-1100 rounded-2xl"
        style={{
          border: '1px solid rgba(255, 255, 255, 10%)',
          backgroundColor: 'rgba(27,18,39,1)',
        }}
      >
        <DialogHeader className="hidden">
          <DialogTitle>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 m-auto text-center">
          <div className="flex gap-4 m-auto">
            {type === 'success' && (
              <CheckCircleFilledIcon className="w-6 h-6 text-[#34C759]" />
            )}
            {type === 'error' && (
              <CloseCircleFilledIcon className="w-6 h-6 text-[#FF3B30]" />
            )}
            <span>{title}</span>
          </div>
          {description != null && <div className="text-sm text-white/80">{description}</div>}
        </div>
        <div className="flex justify-center">
          <DialogClose asChild>
            <Button className="w-30" shape="round" variant="outline">
              {t('common.close')}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
