import { toast } from "sonner";

export const copyToClipboard = (text: string, t: (key: string) => string) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard
        .writeText(text)
        .then(() => {
          toast.success(t('common.copiedSuccess'), {
            position: 'top-center',
          })
          return true
        })
        .catch((err) => {
          console.error('Failed to copy to clipboard:', err)
          toast.error(t('common.copiedFailed'), {
            position: 'top-center',
          })
      return false;
    });
  }
};