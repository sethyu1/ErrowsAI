import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { mobileForgotPasswordApi, fetchCurrentUserApi } from '@/apis';
import { useAuthStore } from '@/stores/auth';
import { useGlobalStore } from '@/stores/global';
import { formatToken } from '@/utils';

async function mobileForgotPassword(data: API.User.MobileForgotPasswordData) {
  const result = await mobileForgotPasswordApi(data);

  if (result?.token) {
    const { token } = result;
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

  return result;
}

export function useMobileForgotPassword() {
  const navigate = useNavigate();
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
    mutateAsync,
  } = useMutation({
    mutationFn: mobileForgotPassword,
    onSuccess: (data) => {
      if (data?.token && data?.user) {
        const { token, user } = data;
        setToken(token);
        setUser(user);
        setOpenAuth(false);
        navigate('/');
        window.location.reload();
      }
    },
  });

  return {
    loading,
    error,
    mobileForgotPassword: mutateAsync
  }
}
