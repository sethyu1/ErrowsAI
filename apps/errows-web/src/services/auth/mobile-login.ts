import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { mobileLoginApi, fetchCurrentUserApi } from '@/apis';
import { useAuthStore } from '@/stores/auth';
import { useGlobalServer } from '@/hooks/use-global-server';
import { formatToken } from '@/utils';
import { STORAGE_KEYS } from '@/config';

async function mobileLogin(data: API.User.MobileLoginData) {
  const { token } = await mobileLoginApi(data);
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

export function useMobileLogin() {
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
    mutateAsync: mobileLoginFn,
  } = useMutation({
    mutationFn: mobileLogin,
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
    mobileLogin: mobileLoginFn
  }
}
