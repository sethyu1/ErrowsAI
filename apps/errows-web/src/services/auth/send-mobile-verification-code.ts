import { useMutation } from '@tanstack/react-query';
import { sendMobileVerificationCodeApi } from '@/apis';

export function useSendMobileVerificationCode() {
  const {
    error,
    isPending: loading,
    mutateAsync: sendMobileVerificationCodeFn,
  } = useMutation({
    mutationFn: sendMobileVerificationCodeApi
  });

  return {
    loading,
    error,
    sendMobileVerificationCode: sendMobileVerificationCodeFn
  }
}
