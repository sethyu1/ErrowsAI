import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 移动端搜索框 Hook
 * 处理移动端搜索框的打开/关闭、获焦、点击外部关闭等逻辑
 */
export function useMobileSearch(isMobile: boolean) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 处理搜索框获焦 - 打开搜索框
  const handleSearchInputFocus = useCallback(() => {
    if (isMobile) {
      setSearchOpen(true);
    }
  }, [isMobile]);

  // 处理点击外部关闭搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMobile || !searchOpen) return;

      const target = event.target as HTMLElement;
      if (!searchContainerRef.current?.contains(target)) {
        setSearchOpen(false);
      }
    };

    if (isMobile && searchOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobile, searchOpen]);

  // 搜索框打开时自动聚焦
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return {
    searchOpen,
    setSearchOpen,
    searchInputRef,
    searchContainerRef,
    handleSearchInputFocus,
  };
}

