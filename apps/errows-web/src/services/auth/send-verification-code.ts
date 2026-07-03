import { useMutation } from '@tanstack/react-query';
import { sendVerificationCodeApi } from '@/apis';

export function useSendVerificationCode() {
  const {
    error,
    isPending: loading,
    mutateAsync: sendVerificationCodeFn,
  } = useMutation({
    mutationFn: sendVerificationCodeApi
  });

  return {
    loading,
    error,
    sendVerificationCode: sendVerificationCodeFn
  }
}