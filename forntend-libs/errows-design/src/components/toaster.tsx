"use client";

import { Toaster as SonnerToaster } from "sonner";
import type { ToasterProps as SonnerToasterProps } from "sonner";
import { toast } from "sonner";
import type { ExternalToast } from "sonner";

export { toast };
export type { SonnerToasterProps as ToasterProps, ExternalToast };

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

export function Toaster(props: SonnerToasterProps) {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      // position="top-right"
      closeButton
      duration={4000}
      gap={12}
      visibleToasts={5}
      toastOptions={{
        classNames: {
          toast: "errows-toast",
          title: "errows-toast-title",
          description: "errows-toast-description",
          actionButton: "errows-toast-button",
          cancelButton: "errows-toast-button",
          closeButton: "errows-toast-close",
          success: "errows-toast-success",
          error: "errows-toast-error",
          warning: "errows-toast-warning",
          info: "errows-toast-info",
        },
      }}
      {...props}
    />
  );
}
