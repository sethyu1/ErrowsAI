import { googleLoginApi, fetchCurrentUserApi, bindPixelApi } from '@/apis';
import { useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores/auth';
import { useGlobalServer } from '@/hooks/use-global-server';
import { usePixelStore } from '@/stores/pixel';
import { formatToken } from '@/utils';
import { STORAGE_KEYS } from '@/config';

async function googleLogin(data: API.User.GoogleLoginData) {
  const { token } = await googleLoginApi(data);
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

export function useOAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore(useShallow(state => ({
    setToken: state.setToken,
    setUser: state.setUser,
  })));
  const { setOpenAuth } = useGlobalServer();
  const pixelData = usePixelStore(state => state.data);

  const {
    error,
    isPending: loading,
    mutateAsync: googleLoginFn,
  } = useMutation({
    mutationFn: googleLogin,
    onSuccess: async (data) => {
      const { token, user } = data;

      if (['/forgot-password'].includes(location.pathname)) {
        navigate('/');
      }

      setToken(token);
      setUser(user);

      try {
        if (pixelData) {
          await bindPixelApi(pixelData);
        }
      } catch (error) {
        console.error(error)
      }

      setOpenAuth(false);
      localStorage.setItem(STORAGE_KEYS.CHRISTMAS_SALE_NEW_USER, '1');
      window.location.reload();
    },
  });

  return {
    loading,
    error,
    googleLogin: googleLoginFn
  }
}
