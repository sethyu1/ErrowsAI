import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@errows/design/components/alert-dialog';
import { useMobile } from '@/hooks/use-mobile-detector';
import type React from 'react';
import { cn } from '@errows/design/lib/utils';

interface ConfirmProps extends React.ComponentProps<typeof AlertDialog> {
  onConfirm?: () => void;
};

export function Confirm(props: ConfirmProps) {
  const { children, onConfirm } = props;
  const { t } = useTranslation();
  const isMobile = useMobile();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent
        className={cn('z-1050 bg-[rgba(27,18,39,1)]', isMobile ? 'w-full' : 'w-90')}
      >
        <AlertDialogHeader>
          <AlertDialogTitle></AlertDialogTitle>
          <AlertDialogDescription className="text-white text-center">
            {t('auth.confirmDeletion')}？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center sm:justify-center mt-3 w-full">
          <div className="flex gap-4 justify-center">
            <AlertDialogCancel
              className="cursor-pointer rounded-full w-30 text-white"
              style={{
                backgroundColor: '#22232A',
                border: '1px solid #2C2C38'
              }}
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer rounded-full w-30 text-white"
              style={{
                backgroundColor: '#22232A',
                border: '1px solid #2C2C38'
              }}
              onClick={onConfirm}
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
