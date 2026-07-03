import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * 处理移动端键盘弹出时的布局问题
 * 锁定背景页面滚动，并动态调整容器高度
 */
export function useMobileKeyboard(
  isMobile: boolean,
  visible: boolean,
  containerRef?: RefObject<HTMLDivElement | null>
) {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!isMobile || !visible) return;

    // 保存当前滚动位置
    scrollYRef.current = window.scrollY;

    // 锁定 body 滚动 - 防止键盘弹出时页面被顶上去
    const originalStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      height: document.body.style.height,
    };

    // 应用锁定样式
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    // 处理视口大小变化（键盘弹出/收起）
    const handleViewportResize = () => {
      if (containerRef?.current && window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        containerRef.current.style.height = `${viewportHeight}px`;
      }
    };

    // 处理视口滚动（防止页面被顶起）
    const handleViewportScroll = () => {
      if (window.visualViewport && window.visualViewport.offsetTop !== 0) {
        // 重置视口偏移
        window.scrollTo(0, 0);
      }
    };

    // 添加事件监听
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    window.visualViewport?.addEventListener('scroll', handleViewportScroll);
    
    // 初始化
    handleViewportResize();

    return () => {
      // 移除事件监听
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleViewportScroll);

      // 恢复 body 样式
      document.body.style.overflow = originalStyles.overflow;
      document.body.style.position = originalStyles.position;
      document.body.style.top = originalStyles.top;
      document.body.style.left = originalStyles.left;
      document.body.style.right = originalStyles.right;
      document.body.style.width = originalStyles.width;
      document.body.style.height = originalStyles.height;

      // 恢复滚动位置
      window.scrollTo(0, scrollYRef.current);
    };
  }, [isMobile, visible, containerRef]);
}
