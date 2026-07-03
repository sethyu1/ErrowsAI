import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useShallow } from 'zustand/react/shallow';
import { fetchCurrentUserApi, bindPixelApi } from '@/apis';
import { useAuthStore } from '@/stores/auth';
import { usePixelStore } from '@/stores/pixel';
import { useEffect, useRef } from 'react';

/**
 * usePixel Hook
 * 实现逻辑：
 * 1. 当 pixelData 存在且用户已登录时，获取当前用户信息
 * 2. 如果返回的用户数据中不存在 pixel 数据，则触发 bindPixel 变动
 * 3. bindPixel 失败时会进行无限重试（轮询），直到成功
 */
export function usePixel() {
  const { user, token, setPixel } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
      user: state.user,
      setPixel: state.setPixel,
    }))
  );
  const pixelData = usePixelStore(state => state.data);
  const queryClient = useQueryClient();
  const bindTriggeredRef = useRef(false);

  const hasPixelToBind = !!(pixelData?.pixel_id || pixelData?.pixel || pixelData?.r_pixel_id || pixelData?.clickid || pixelData?.siteid);

  const { data: userData, isFetched } = useQuery({
    queryKey: ['pixel-user-check', token],
    queryFn: () => fetchCurrentUserApi(),
    enabled: !!token && hasPixelToBind,
    retry: 3,
    staleTime: 1000 * 10,
  });

  const needMetaBind = isFetched && (pixelData?.pixel_id || pixelData?.pixel) && !userData?.pixel?.pixel_id;
  const needRedditBind = isFetched && pixelData?.r_pixel_id && !userData?.pixel?.r_pixel_id;
  const needConversionBind = isFetched && (pixelData?.clickid || pixelData?.siteid) &&
    (userData?.pixel?.clickid !== pixelData?.clickid || userData?.pixel?.siteid !== pixelData?.siteid);
  const needBind = needMetaBind || needRedditBind || needConversionBind;
  const doneBind = isFetched &&
    (!(pixelData?.pixel_id || pixelData?.pixel) || userData?.pixel?.pixel_id) &&
    (!pixelData?.r_pixel_id || userData?.pixel?.r_pixel_id) &&
    (!(pixelData?.clickid || pixelData?.siteid) || (userData?.pixel?.clickid === pixelData?.clickid && userData?.pixel?.siteid === pixelData?.siteid));

  const { mutate: bindPixel, reset } = useMutation({
    mutationFn: (data: API.Pixel.BindPixelData) => bindPixelApi(data),
    retry: true,
    retryDelay: 5000,
    onSuccess: () => {
      setPixel(pixelData);
      queryClient.invalidateQueries({ queryKey: ['pixel-user-check'] });
    }
  });

  useEffect(() => {
    if (!token) return;

    if (doneBind) {
      bindTriggeredRef.current = false;
      reset();
      return;
    }

    if (needBind && pixelData && !bindTriggeredRef.current) {
      bindTriggeredRef.current = true;
      bindPixel(pixelData);
    }
  }, [doneBind, needBind, pixelData, token]);

  return { userData };
}
