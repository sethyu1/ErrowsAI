import { useEffect } from 'react';
import { useGlobalStore } from '@/stores/global';

const MOBILE_BREAKPOINT = 640;

/**
 * 检测并监听窗口大小变化，自动更新移动端状态
 */
export function useMobileDetector() {
  const setIsMobile = useGlobalStore(state => state.setIsMobile);

  useEffect(() => {
    const checkIsMobile = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(isMobile);
    };

    // 初始化检测
    checkIsMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [setIsMobile]);
}

export const useMobile = () => {
  const isMobile = useGlobalStore(state => state.isMobile);
  return isMobile;
}
