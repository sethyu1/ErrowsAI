import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addPrefix } from '@/utils';

type UserInfo = API.User.Info;
type PixelData = API.Pixel.BindPixelData;
interface AuthStore {
  /** Token */
  token: string;
  /** 用户信息 */
  user: UserInfo | null;

  setUser: (user: UserInfo | null) => void;
  setToken: (token: string) => void;
  setPixel: (user: PixelData | null) => void;
  updateAvatar: (url: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: '',
      user: null,

      setUser: (user) => {
        if (user?.profile?.avatar) {
          try {
            const url = new URL(user.profile.avatar, window.location.origin);
            url.searchParams.set('t', Date.now().toString());
            user.profile.avatar = url.toString();
          } catch {
            // 如果不是合法 URL，则直接添加参数（可能是相对路径）
            const separator = user.profile.avatar.includes('?') ? '&' : '?';
            user.profile.avatar = `${user.profile.avatar}${separator}t=${Date.now()}`;
          }
        }
        localStorage.setItem('errows.user.name', user?.name || '')
        set({ user });
      },
      setPixel: (pixel) => {
        if (pixel) {
          set({
            user: {
              ...get().user!,
              pixel,
            }
          });
        }
      },
      setToken: (token) => {
        set({ token });
      },
      updateAvatar: (url) => {
        let avatarUrl = url;
        try {
          const u = new URL(url, window.location.origin);
          u.searchParams.set('t', Date.now().toString());
          avatarUrl = u.toString();
        } catch {
          const separator = url.includes('?') ? '&' : '?';
          avatarUrl = `${url}${separator}t=${Date.now()}`;
        }

        set({
          user: {
            ...get().user!,
            profile: {
              ...(get().user?.profile || { gender: '' }),
              avatar: avatarUrl,
            },
          },
        });
      },
    }),
    { name: addPrefix('auth') },
  ),
);
