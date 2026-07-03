import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addPrefix } from '@/utils';

type UserInfo = API.User.Info;
interface AuthStore {
  /** Token */
  token: string;
  /** 用户信息 */
  user: UserInfo | null;

  setUser: (user: UserInfo | null) => void;
  setToken: (token: string) => void;
  updateAvatar: (url: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: '',
      user: null,

      setUser: (user) => {
        localStorage.setItem('errows.console.user.name', user?.name || '')
        set({ user });
      },
      setToken: (token) => {
        set({ token });
      },
      updateAvatar: (url) => {
        return {
          user: {
            ...get().user,
            profile: {
              ...(get().user?.profile || {}),
              avatar: url,
            },
          },
        };
      },
    }),
    { name: addPrefix('auth') },
  ),
);
