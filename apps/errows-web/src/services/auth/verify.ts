import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import { useGlobalServer } from '@/hooks/use-global-server';
import { useShallow } from 'zustand/react/shallow';
import { verifyApi, fetchCurrentUserApi, bindPixelApi } from '@/apis';
import { VerifyEnum } from '@/config';
import { formatToken, addPrefix } from '@/utils';
import { usePixelStore } from '@/stores/pixel';

async function verify(data: API.User.VerifyData) {
  const { token } = await verifyApi(data);
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

export function useVerify() {
  const navigate = useNavigate();
  const { setOpenChangePassword } = useGlobalServer();
  const [searchParams] = useSearchParams();
  const { setToken, setUser } = useAuthStore(useShallow(state => ({
    setToken: state.setToken,
    setUser: state.setUser,
  })));
  const pixelData = usePixelStore(state => state.data);

  const id = searchParams.get('uid');
  const code = searchParams.get('code');
  const type = searchParams.get('type') || VerifyEnum.REGISTER;

  const {
    error,
    isPending: loading,
    mutateAsync: verifyFn,
  } = useMutation({
    mutationFn: verify
  });

  React.useEffect(
    () => {
      if (id && code) {
        verifyFn({ uid: id, code })
          .then(async (data) => {
            const { token, user } = data;

            if (type === VerifyEnum.REGISTER) {
              setToken(token);
              setUser(user);

              try {
                if (pixelData) {
                  await bindPixelApi(pixelData);
                }
              } catch (error) {
                console.error(error)
              }

              navigate(`/`);
              window.location.reload();
              return;
            }

            if (type === VerifyEnum.FORGOT_PASSWORD) {
              setOpenChangePassword(true);
              sessionStorage.setItem(addPrefix('token'), token);
            }
          })
        }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, code, type]
  )

  return {
    error,
    loading,
  }
}
