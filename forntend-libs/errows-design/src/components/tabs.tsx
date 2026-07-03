import React, { useState, useRef, useEffect } from 'react';

export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
  style?: React.CSSProperties;
  size?: 'default' | 'small';
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveKey,
  activeKey: controlledActiveKey,
  onChange,
  className = '',
  style,
  size = 'default',
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState(
    defaultActiveKey || items[0]?.key || ''
  );
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLDivElement | null)[]>([]);

  // 判断是否受控组件
  const isControlled = controlledActiveKey !== undefined;
  const activeKey = isControlled ? controlledActiveKey : internalActiveKey;

  // 更新下划线位置
  useEffect(() => {
    const activeIndex = items.findIndex(item => item.key === activeKey);
    const activeTab = tabsRef.current[activeIndex];
    
    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [activeKey, items]);

  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return;

    if (!isControlled) {
      setInternalActiveKey(key);
    }
    
    onChange?.(key);
  };

  const setTabRef = (index: number) => (el: HTMLDivElement | null) => {
    tabsRef.current[index] = el;
  };

  // 根据 size 设置不同的样式
  const sizeClasses = size === 'small' 
    ? 'px-4 py-2 text-[14px]' 
    : 'px-6 py-3 text-[14px]';

  return (
    <div
      className={`relative flex items-center ${className}`}
      style={style}
    >
      {items.map((item, index) => {
        const isActive = activeKey === item.key;
        const isDisabled = item.disabled;

        return (
          <div
            key={item.key}
            ref={setTabRef(index)}
            onClick={() => handleTabClick(item.key, item.disabled)}
            className={`
              relative ${sizeClasses} font-semibold transition-colors duration-100
              ${isActive ? 'text-white' : 'text-[#6B6B7B]'}
              ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-white'}
            `}
            style={{
              fontFamily: 'Urbanist',
              userSelect: 'none',
            }}
          >
            {item.label}
          </div>
        );
      })}

      {/* 底部下划线指示器 */}
      <div
        className="absolute bottom-0 h-[2px] bg-white transition-all duration-150 ease-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />
    </div>
  );
};

