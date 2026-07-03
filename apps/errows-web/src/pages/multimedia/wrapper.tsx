import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMobile } from "@/hooks/use-mobile-detector";
import { cn } from "@errows/design/lib/utils";
import { PC_CARD_WIDTH } from "./constants";


interface MultimediaWrapperProps {
    children: React.ReactNode;
    cardWidth?: number;
    gap?: number;
    className?: string;
}

export function MultimediaWrapper(props: MultimediaWrapperProps) {
    const { children, cardWidth = PC_CARD_WIDTH, gap = 8, className } = props;
    const isMobile = useMobile();
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [pcPadding, setPcPadding] = useState<number>(0);

    // 计算 padding 的函数
    const calculatePadding = useCallback(() => {
        if (isMobile || !containerRef.current) {
            setPcPadding(0);
            return;
        }

        const cw = isMobile ? Math.min(179, Math.floor((window.innerWidth - 32) / 2)) : cardWidth;

        // 使用容器实际宽度进行计算
        const containerWidth = containerRef.current.clientWidth;
        
        // 计算每列占用的宽度（卡片宽度 + 间距）
        const columnWidth = cw + gap;
        // 计算可以放置多少列（向下取整）
        const columnCount = Math.floor(containerWidth / columnWidth);
        
        if (columnCount > 0) {
            // 计算所有列占用的总宽度：列数 * 卡片宽度 + (列数 - 1) * 间距
            const totalColumnsWidth = columnCount * cw + (columnCount - 1) * gap;
            // 计算剩余空间并除以2得到左右padding，使卡片居中并填满容器
            const padding = (containerWidth - totalColumnsWidth) / 2;
            setPcPadding(padding < cw/2 ? (cw/2 + padding) : padding);
        } else {
            // 如果窗口太小，至少保证最小padding
            setPcPadding(0);
        }
    }, [cardWidth, gap, isMobile]);

    // 监听容器宽度变化（使用 ResizeObserver + 防抖）
    useEffect(() => {
        if (!containerRef.current) return;

        // 初始计算
        calculatePadding();

        const resizeObserver = new ResizeObserver(() => {
            // 清除之前的定时器
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            // 设置新的防抖定时器
            timeoutRef.current = setTimeout(() => {
                calculatePadding();
            }, 150);
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [calculatePadding]);

    return (
        <div 
            ref={containerRef}
            className={cn(
                "relative w-full overflow-scroll scrollbar-hide pb-8 mt-20",
                isMobile ? `pt-0 pl-3 pr-3 ${className} pb-0` : '',
            )}
            style={{
                ...isMobile ? {} : {
                    paddingLeft: pcPadding,
                    paddingRight: pcPadding
                }
            }}
        >
            {
                React.isValidElement(children) ? 
                    React.cloneElement(children, {
                        padding: pcPadding
                    } as React.Attributes)
                : children
            }
        </div>
    );
}