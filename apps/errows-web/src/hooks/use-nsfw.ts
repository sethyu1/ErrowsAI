import { useState, useEffect } from "react";

const NSFW_STORAGE_KEY = "nsfw_enabled";

export function useNSFW() {
  const [nsfwEnabled, setNsfwEnabled] = useState(false);

  useEffect(() => {
    // 从 localStorage 读取 NSFW 状态
    const stored = localStorage.getItem(NSFW_STORAGE_KEY);
    if (stored === "true") {
      setNsfwEnabled(true);
    }
  }, []);

  const enableNSFW = () => {
    setNsfwEnabled(true);
    localStorage.setItem(NSFW_STORAGE_KEY, "true");
  };

  const disableNSFW = () => {
    setNsfwEnabled(false);
    localStorage.setItem(NSFW_STORAGE_KEY, "false");
  };

  return {
    nsfwEnabled,
    enableNSFW,
    disableNSFW,
  };
}
