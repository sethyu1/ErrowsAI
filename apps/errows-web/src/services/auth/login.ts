import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { loginApi, fetchCurrentUserApi } from '@/apis';
import { useAuthStore } from '@/stores/auth';
import { useGlobalServer } from '@/hooks/use-global-server';
import { formatToken } from '@/utils';
import { STORAGE_KEYS } from '@/config';

async function login(data: API.User.LoginData) {
  const { token } = await loginApi(data);
  const user = await fetchCurrentUserApi({
    headers: {
      Authorization: formatToken(token),
    },
  });

  return {
    token,
    user
  };
}

export function useLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore(useShallow(state => ({
    setToken: state.setToken,
    setUser: state.setUser,
  })));
  const { setOpenAuth } = useGlobalServer();

  const {
    error,
    isPending: loading,
    mutateAsync: loginFn,
  } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      const { token, user } = data;

      if (['/forgot-password'].includes(location.pathname)) {
        navigate('/');
      }

      setToken(token);
      setUser(user);

      setOpenAuth(false);
      localStorage.setItem(STORAGE_KEYS.CHRISTMAS_SALE_NEW_USER, '1');
      window.location.reload();
    },
  });

  return {
    loading,
    error,
    login: loginFn
  }
}
