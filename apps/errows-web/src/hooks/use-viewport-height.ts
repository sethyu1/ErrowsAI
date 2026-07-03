import { useState, useEffect, useRef } from 'react';

/**
 * 计算实际浏览器视口高度，减去指定值
 * 用于解决避免被底部工具栏、系统导航栏遮挡，同时适配窗口尺寸变化等问题
 * 
 * @param subtract - 要减去的高度值，可以是数字（像素值）或字符串（如 "72px"），默认 0
 * @returns 计算后的实际容器高度（像素值）
 */
export function useViewportHeight(subtract: number | string = 0): number {
    // 解析 subtract 参数，支持数字和字符串（如 "72px"）
    const parseSubtract = (value: number | string): number => {
        if (typeof value === 'number') {
            return value;
        }
        // 如果是字符串，提取数字部分
        const match = value.toString().match(/(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    };

    const subtractValue = parseSubtract(subtract);
    
    // 获取实际视口高度，优先使用 visualViewport（移动端键盘场景更准确）
    const getViewportHeight = () => {
        return window.visualViewport?.height || window.innerHeight;
    };
    
    const [height, setHeight] = useState(() => {
        return Math.max(0, getViewportHeight() - subtractValue);
    });

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const updateHeight = () => {
            const newHeight = Math.max(0, getViewportHeight() - subtractValue);
            setHeight(newHeight);
        };

        const handleResize = () => {
            // 使用防抖来优化性能
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                updateHeight();
            }, 150);
        };

        // 初始化时更新一次
        updateHeight();

        // 监听窗口大小变化
        window.addEventListener('resize', handleResize);
        // 监听视口变化（移动端键盘弹出等场景）
        window.addEventListener('orientationchange', handleResize);
        // 监听 visualViewport 变化（移动端键盘弹出时更准确）
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [subtractValue]);

    return height;
}
