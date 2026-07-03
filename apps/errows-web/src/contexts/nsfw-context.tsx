import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/auth";
import { useShallow } from "zustand/react/shallow";

const NSFW_STORAGE_KEY_PREFIX = "nsfw_enabled_";
const NSFW_PENDING_ENABLE_KEY = "nsfw_pending_enable";

interface NSFWContextValue {
  nsfwEnabled: boolean;
  enableNSFW: () => void;
  disableNSFW: () => void;
}

const NSFWContext = createContext<NSFWContextValue | undefined>(undefined);

// 获取用户特定的 NSFW storage key
function getNSFWStorageKey(userId: string | null | undefined): string {
  if (!userId) {
    return NSFW_STORAGE_KEY_PREFIX + "guest";
  }
  return NSFW_STORAGE_KEY_PREFIX + userId;
}

export function NSFWProvider({ children }: { children: React.ReactNode }) {
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const { token, user } = useAuthStore(useShallow((state) => ({ 
    token: state.token, 
    user: state.user 
  })));
  const previousUserIdRef = useRef<string | null>(null);

  // 从 localStorage 读取当前用户的初始状态
  useEffect(() => {
    const userId = user?.id;
    const storageKey = getNSFWStorageKey(userId);
    
    if (token && userId) {
      // 已登录：读取该用户的 NSFW 状态
      const stored = localStorage.getItem(storageKey);
      if (stored === "true") {
        setNsfwEnabled(true);
      } else {
        setNsfwEnabled(false);
      }
    } else {
      // 未登录：自动关闭 NSFW
      setNsfwEnabled(false);
    }
    
    previousUserIdRef.current = userId || null;
  }, []);

  // 监听用户切换（token 或 user.id 变化）
  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;
    
    // 如果用户切换了，保存上一个用户的状态，加载新用户的状态
    if (previousUserId !== currentUserId && previousUserId !== null) {
      // 保存上一个用户的状态（如果已登录）
      if (token && previousUserId) {
        const prevStorageKey = getNSFWStorageKey(previousUserId);
        localStorage.setItem(prevStorageKey, nsfwEnabled ? "true" : "false");
      }
    }
    
    if (token && currentUserId) {
      // 用户登录或切换：恢复该用户的 NSFW 状态
      const storageKey = getNSFWStorageKey(currentUserId);
      const stored = localStorage.getItem(storageKey);
      const pendingEnable = localStorage.getItem(NSFW_PENDING_ENABLE_KEY);
      
      if (pendingEnable === "true") {
        // 如果存在待启用标记，自动启用 NSFW
        localStorage.removeItem(NSFW_PENDING_ENABLE_KEY);
        setNsfwEnabled(true);
        localStorage.setItem(storageKey, "true");
        // 手动触发 storage 事件
        window.dispatchEvent(new StorageEvent("storage", {
          key: storageKey,
          newValue: "true",
        }));
      } else if (stored === "true") {
        // 恢复该用户之前保存的 NSFW 状态
        setNsfwEnabled(true);
      } else {
        setNsfwEnabled(false);
      }
    } else {
      // 未登录状态下自动关闭 NSFW
      if (nsfwEnabled) {
        setNsfwEnabled(false);
        // 清除待启用标记（如果存在）
        localStorage.removeItem(NSFW_PENDING_ENABLE_KEY);
      }
    }
    
    previousUserIdRef.current = currentUserId;
  }, [token, user?.id, nsfwEnabled]);

  // 监听 localStorage 变化（用于跨标签页同步）
  useEffect(() => {
    const userId = user?.id;
    const storageKey = getNSFWStorageKey(userId);
    
    const handleStorageChange = (e: StorageEvent) => {
      // 只处理当前用户的 NSFW 状态变化
      if (e.key === storageKey && token && userId) {
        setNsfwEnabled(e.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [token, user?.id]);

  const enableNSFW = useCallback(() => {
    const userId = user?.id;
    if (!token || !userId) {
      // 未登录状态下不能启用 NSFW
      return;
    }
    
    setNsfwEnabled(true);
    const storageKey = getNSFWStorageKey(userId);
    localStorage.setItem(storageKey, "true");
    // 手动触发 storage 事件（用于同标签页内的同步）
    window.dispatchEvent(new StorageEvent("storage", {
      key: storageKey,
      newValue: "true",
    }));
  }, [token, user?.id]);

  const disableNSFW = useCallback(() => {
    const userId = user?.id;
    if (!token || !userId) {
      // 未登录状态下不能禁用 NSFW（已经是关闭状态）
      return;
    }
    
    setNsfwEnabled(false);
    const storageKey = getNSFWStorageKey(userId);
    localStorage.setItem(storageKey, "false");
    // 手动触发 storage 事件
    window.dispatchEvent(new StorageEvent("storage", {
      key: storageKey,
      newValue: "false",
    }));
  }, [token, user?.id]);

  return (
    <NSFWContext.Provider value={{ nsfwEnabled, enableNSFW, disableNSFW }}>
      {children}
    </NSFWContext.Provider>
  );
}

export function useNSFW() {
  const context = useContext(NSFWContext);
  if (context === undefined) {
    throw new Error("useNSFW must be used within NSFWProvider");
  }
  return context;
}
