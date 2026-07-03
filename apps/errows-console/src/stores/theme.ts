import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addPrefix } from '@/utils';

const THEME_KEY = `${addPrefix('theme')}`;

interface ThemeStore {
  /** 是否深色模式 */
  isDark: boolean;
  
  setIsDark: (isDark: boolean) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      isDark: true, // 默认 dark

      setIsDark: (isDark: boolean) => {
        set({ isDark });
      },

      toggleTheme: () => {
        set({ isDark: !get().isDark });
      },
    }),
    { name: THEME_KEY },
  ),
);

