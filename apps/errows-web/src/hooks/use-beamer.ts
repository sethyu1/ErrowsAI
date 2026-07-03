import { useEffect, useCallback } from 'react';
import {
  initBeamerConfig,
  openBeamerPanel,
  closeBeamerPanel,
} from '@/utils/beamer';

interface UseBeamerOptions {
  userId?: string;
  userEmail?: string;
  customUserId?: string;
  autoInit?: boolean;
}

/**
 * 管理Beamer通知面板
 */
export const useBeamer = (options: UseBeamerOptions = {}) => {
  const {
    userId,
    userEmail,
    customUserId,
    autoInit = true,
  } = options;

  // 初始化Beamer配置
  useEffect(() => {
    if (autoInit && userId && userEmail) {
      initBeamerConfig(userId, userEmail, customUserId);
    }
  }, [userId, userEmail, customUserId, autoInit]);

  // 打开面板
  const handleOpen = useCallback(() => {
    openBeamerPanel();
  }, []);

  // 关闭面板
  const handleClose = useCallback(() => {
    closeBeamerPanel();
  }, []);


  return {
    openBeamer: handleOpen,
    closeBeamer: handleClose,
  };
};

