import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { registerApi, fetchCurrentUserApi } from '@/apis';
import { useAuthStore } from '@/stores/auth';
import { useGlobalStore } from '@/stores/global';
import { usePixelStore } from '@/stores/pixel';
import { formatToken } from '@/utils';
import { STORAGE_KEYS } from '@/config';

async function register(data: API.User.RegisterData) {
  const { token } = await registerApi(data);
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

export function useRegister() {
  const navigate = useNavigate();
  const pixelData = usePixelStore(state => state.data);
  const { setToken, setUser } = useAuthStore(useShallow(state => ({
    setToken: state.setToken,
    setUser: state.setUser,
  })));
  const { setOpenAuth } = useGlobalStore(useShallow(state => ({
    setOpenAuth: state.setOpenAuth,
  })));

  const {
    error,
    isPending: loading,
    mutateAsync: registerFn,
  } = useMutation({
    mutationFn: (data: API.User.RegisterData) => register({
      ...data,
      ...(pixelData?.clickid && { clickid: pixelData.clickid }),
      ...(pixelData?.siteid && { siteid: pixelData.siteid }),
    }),
    onSuccess: (data) => {
      const { token, user } = data;
      setToken(token);
      setUser(user);
      setOpenAuth(false);
      localStorage.setItem(STORAGE_KEYS.CHRISTMAS_SALE_NEW_USER, '1');
      navigate('/');
      window.location.reload();
    },
  });

  return {
    loading,
    error,
    register: registerFn
  }
}
