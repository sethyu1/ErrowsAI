import React from "react";
import { useAuthStore } from "@/stores/auth";
import { useShallow } from "zustand/react/shallow";
import { useGlobalStore } from "@/stores/global";

export const useAuthCheck = () => {
  const { token } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
    }))
  );
  const isLogin = Boolean(token);
  const setOpenAuth = useGlobalStore.getState().setOpenAuth;
  const handleAuthCheck = (authType?: 'login' | 'signup') => {
    if (!isLogin) {
      setOpenAuth(true, authType ?? "login");
    }
  };
  return {
    isLogin,
    gotoLogin: handleAuthCheck,
  };
};
