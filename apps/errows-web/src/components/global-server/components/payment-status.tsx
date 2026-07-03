import React from 'react';
import {
  Dialog,
  DialogOverlay,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from '@errows/design/components/dialog';
import { Button } from '@errows/design/components/button';
import { useTranslation } from 'react-i18next';
import { usePayment } from '@/services/payment';
import { useMemberInfo } from '@/services/member';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface PaymentStatusProps extends React.ComponentProps<typeof Dialog> {}

export function PaymentStatus(props: PaymentStatusProps) {
  const { onOpenChange } = props;
  const { t } = useTranslation();
  const { paymentId, paymentStatus, paymentStatusLoading } = usePayment();
  const { refetch } = useMemberInfo();

  const handleConfirm = async () => {
    if (!paymentId) return;
    
    try {
      const result = await paymentStatus(paymentId);
      
      if (result.status === 'succeeded') {
        toast.success(t('payment.paymentSuccessMessage'));
        await refetch();
        onOpenChange?.(false);
      } else if (result.status === 'pending') {
        toast.warning(t('payment.paymentPendingMessage'));
      } else if (result.status === 'failed') {
        toast.error(t('payment.paymentFailedMessage'));
        onOpenChange?.(false);
      }
    } catch (error) {
      toast.error(t('payment.paymentStatusQueryError'));
    }
  };

  return (
    <Dialog {...props}>
      <DialogOverlay className="bg-[rgba(0,0,0,0.8)] z-1199" />
      <DialogContent
        className="w-120 z-1200 rounded-2xl overflow-hidden [&>button]:hidden"
        style={{
          border: '1px solid rgba(255, 255, 255, 10%)',
          backgroundColor: 'rgba(27,18,39,1)',
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            {t('payment.paymentConfirmation')}
          </DialogTitle>
        </DialogHeader>

        <div className="w-full text-center pb-4 text-white/80">
          {t('payment.paymentStatusDescription')}
        </div>

        <div className="flex w-full justify-center gap-4 pb-4">
          <Button
            variant="outline"
            type="reset"
            className="w-30 cursor-pointer"
            shape="round"
            onClick={() => onOpenChange?.(false)}
          >
            {t('payment.notPaid')}
          </Button>
          <Button
            type="submit"
            className="w-30 cursor-pointer"
            appearance="gradientFill"
            shape="round"
            loading={paymentStatusLoading}
            onClick={handleConfirm}
          >
            {t('payment.paid')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
