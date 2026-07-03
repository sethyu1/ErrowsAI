import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // 阻止默认的安装提示
      e.preventDefault();
      // 保存事件，以便稍后触发
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 检查是否已经安装
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      return {
        success: false,
        message: "PWA installation is not available",
      };
    }

    try {
      // 显示安装提示
      await deferredPrompt.prompt();
      // 等待用户响应
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return {
          success: true,
          message: "PWA installed successfully",
        };
      } else {
        return {
          success: false,
          message: "PWA installation dismissed",
        };
      }
    } catch (error) {
      console.error("Error installing PWA:", error);
      return {
        success: false,
        message: "Failed to install PWA",
      };
    }
  };

  return {
    isInstallable,
    installPWA,
  };
};
