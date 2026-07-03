import { useState, useEffect } from "react";

interface UseMobileStyleProps {
    /** 单个卡片的宽度 */
    cardWidth: number;
    /** 是否是移动端 */
    isMobile: boolean;
    /** 卡片之间的间距 */
    gap?: number;
    /** 一行放多少个卡片 */
    columnCount?: number;
    /** 需要减去的宽度值 */
    subtractWidth?: number;
}   

export const useMobileStyle = ({
    cardWidth=180, 
    isMobile=false,
    gap=8,
    columnCount=2,
    subtractWidth=24,
}: UseMobileStyleProps) => {
  const [mobileStyle, setMobileStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!isMobile) return;
    
    const resizeObserver = new ResizeObserver(() => {
      const width = window.innerWidth;
      const gapWidth = width - cardWidth * columnCount - gap * (columnCount - 1) - subtractWidth;
      setMobileStyle(
        gapWidth > 0 
          ? { paddingLeft: gapWidth / 2, paddingRight: gapWidth / 2 } 
          : {}
      );
    });
    
    resizeObserver.observe(document.body);
    return () => resizeObserver.disconnect();
  }, [isMobile, cardWidth]);

  return mobileStyle;
};

