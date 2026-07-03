import { useMutation } from '@tanstack/react-query';
import { updatePasswordApi } from '@/apis';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import { useGlobalServer } from '@/hooks/use-global-server';
import { formatToken, addPrefix } from '@/utils';

const tokenKey = addPrefix('token');

async function updatePassword(data: API.User.UpdatePasswordData) {
  const token = sessionStorage.getItem(tokenKey) || useAuthStore.getState().token;

  return await updatePasswordApi(data, {
    headers: {
      Authorization: formatToken(token),
    },
  });
}

export function useUpdatePassword() {
  const navigate = useNavigate();
  const { setOpenChangePassword, setOpenAuth } = useGlobalServer();

  const {
    error,
    isPending: loading,
    mutateAsync,
  } = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      setOpenChangePassword(false);

      if (sessionStorage.getItem(tokenKey)) {
        navigate('/');
        setOpenAuth(true, 'login');
        sessionStorage.removeItem(tokenKey);
      }
    }
  });

  return {
    loading,
    error,
    updatePassword: mutateAsync
  }
}
