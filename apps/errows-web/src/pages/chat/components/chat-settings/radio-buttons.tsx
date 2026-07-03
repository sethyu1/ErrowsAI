import React, { useRef, useState } from "react";
import { Button } from "@errows/design";
import { PlusIcon, CloseIcon } from "@errows/icons";
import { useIsMobile } from "@/hooks/use-mobile";

interface Item {
  label: string;
  value: string;
}

interface RadioButtonProps {
  items: Item[];
  onChange: (value: string) => void;
  value?: string;
  onPlusClick?: () => void;
  onDelete?: (value: string) => void;
  deletable?: boolean; // 是否显示删除按钮
}

export const RadioButtons: React.FC<
  React.PropsWithChildren<RadioButtonProps>
> = ({ items, value, onChange, children, onPlusClick, onDelete, deletable = false }) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleClick = (value: string) => {
    // 只有在没有拖拽时才触发点击
    if (!isDragging) {
      onChange(value);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
    containerRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // 调整滚动速度
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (containerRef.current) {
        containerRef.current.style.cursor = "grab";
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 relative shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-grab select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {items.map((item) => {
        const isSelected = value === item.value;
        return (
          <div key={item.value} className="relative flex-shrink-0 group">
            <Button
              variant={isSelected ? "default" : "secondary"}
              onClick={() => handleClick(item.value)}
              className={`
                px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${
                  isSelected
                    ? "bg-white text-gray-900 hover:bg-white/90"
                    : "bg-[#22232A] text-gray-300 hover:bg-gray-700"
                }
                ${deletable && onDelete ? "pr-8" : ""}
              `}
            >
              {item.label}
            </Button>
            {deletable && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDragging) {
                    onDelete(item.value);
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className={`
                  absolute right-2 top-1/2 -translate-y-1/2 
                  flex items-center justify-center rounded-full 
                  transition-colors
                  ${
                    isSelected
                      ? "hover:bg-gray-900/10 active:bg-gray-900/20"
                      : "hover:bg-white/10 active:bg-white/20"
                  }
                  ${isMobile ? 'size-5 opacity-60' : 'size-4 opacity-0 group-hover:opacity-100'}
                `}
              >
                <CloseIcon 
                  className={`
                    ${isMobile ? "size-3.5" : "size-3"}
                    ${isSelected ? "text-gray-900" : "text-gray-300"}
                  `} 
                />
              </button>
            )}
          </div>
        );
      })}
      {typeof onPlusClick === "function" && (
        <Button
          variant="secondary"
          size="icon"
          className="size-9 rounded-full"
          onClick={onPlusClick}
        >
          <PlusIcon />
        </Button>
      )}
      {children}
    </div>
  );
};
