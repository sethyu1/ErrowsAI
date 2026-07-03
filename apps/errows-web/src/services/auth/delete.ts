import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { deleteAccountApi } from '@/apis';
import { useAuthStore } from '@/stores/auth';

export function useDeleteAccount() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore(useShallow(state => ({
    setUser: state.setUser,
    setToken: state.setToken,
  })));

  const onSuccess = () => {
    setToken('');
    setUser(null);

    navigate('/')
    window.location.reload();
  };

  const {
    error,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationFn: deleteAccountApi,
    onSuccess: onSuccess,
  });

  return { deleteAccount: mutateAsync, loading, error };
}
