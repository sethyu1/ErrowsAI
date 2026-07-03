import { useState, useEffect, useRef } from 'react';

interface UseAutoHideOptions {
  /**
   * Whether to enable auto-hide behavior
   */
  enabled?: boolean;
  /**
   * Scroll threshold to trigger hide (in pixels)
   */
  scrollThreshold?: number;
  /**
   * Delay before showing again after scroll stops (in milliseconds)
   */
  showDelay?: number;
  /**
   * Scroll container element ID
   */
  scrollContainerId?: string;

  defaultVisible?: boolean;

  autoShow?: boolean;
}

/**
 * Hook to auto-hide elements on scroll with a delay before showing again
 * @param options Configuration options
 * @returns isVisible - whether the element should be visible
 */
export const useAutoHide = (options: UseAutoHideOptions = {}) => {
  const {
    enabled = true,
    scrollThreshold = 50,
    showDelay = 3000,
    scrollContainerId,
    defaultVisible = true,
    autoShow = true,
  } = options;

  const [isVisible, setIsVisible] = useState(defaultVisible);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }

    const scrollContainer = scrollContainerId
      ? document.getElementById(scrollContainerId)
      : window;

    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainerId
        ? (scrollContainer as HTMLElement).scrollTop
        : window.scrollY;

      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      // If scrolled to top, show immediately
      if (currentScrollY <= 10) {
        setIsVisible(true);
        isScrolling.current = false;
        lastScrollY.current = currentScrollY;
        return;
      }

      // Check if scrolling down beyond threshold
      if (Math.abs(currentScrollY - lastScrollY.current) > scrollThreshold) {
        if (currentScrollY > lastScrollY.current && currentScrollY > scrollThreshold) {
          // Scrolling down - hide
          setIsVisible(false);
          isScrolling.current = true;
        }
        lastScrollY.current = currentScrollY;
      }

      // Set timeout to show again after scroll stops
      scrollTimeout.current = setTimeout(() => {
        if (isScrolling.current && autoShow) {
          setIsVisible(true);
          isScrolling.current = false;
        }
      }, showDelay);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current && autoShow) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [enabled, scrollThreshold, showDelay, scrollContainerId, autoShow]);

  return { isVisible, setIsVisible };
};
