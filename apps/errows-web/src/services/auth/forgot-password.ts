import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { forgotPasswordApi, fetchCurrentUserApi } from '@/apis';
import { useAuthStore } from '@/stores/auth';
import { useGlobalStore } from '@/stores/global';
import { formatToken } from '@/utils';

async function forgotPassword(data: API.User.ForgotPasswordData) {
  const result = await forgotPasswordApi(data);
  
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

export function useForgotPassword() {
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
    mutationFn: forgotPassword,
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
    forgotPassword: mutateAsync
  }
}
