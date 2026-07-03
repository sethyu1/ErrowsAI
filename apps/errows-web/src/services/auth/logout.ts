import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { logoutApi } from '@/apis';
import { useAuthStore } from '@/stores/auth';

export function useLogout() {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore(useShallow(state => ({
    setUser: state.setUser,
    setToken: state.setToken,
  })));

  const onFinally = () => {
    setToken('');
    setUser(null);

    navigate('/');
    window.location.reload();
  };

  const {
    error,
    isPending: loading,
    mutateAsync: logoutFn,
  } = useMutation({
    mutationFn: logoutApi,
    onSuccess: onFinally,
    onError: onFinally,
  });

  return { logout: logoutFn, loading, error };
}
