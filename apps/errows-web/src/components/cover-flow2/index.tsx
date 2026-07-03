import React, { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  FInfoIcon,
  BInfoIcon,
  ChatIcon,
  HeartIcon,
  IntimacyIcon,
} from "@errows/icons";
import { useChatServices } from "@/pages/chat/services";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth";
import { useShallow } from "zustand/react/shallow";
import { useGlobalStore } from "@/stores/global";
import { formatCompactNumber } from "@/utils/util";
interface CoverFlowProps {
  items: API.Character.CHARACTER[];
}

export const CoverFlow: React.FC<CoverFlowProps> = ({ items }) => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sortedItems = [...items].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeA - timeB;
  });
  const total = sortedItems.length;
  const [isFlipped, setIsFlipped] = useState(false);
  const dragStartTimeRef = useRef<number>(0);
  const { chatSettings } = useChatServices();

  const { token } = useAuthStore(
    useShallow((state) => ({
      token: state.token,
    }))
  );
  const setOpenAuth = useGlobalStore.getState().setOpenAuth;
  const isLogin = Boolean(token);

  const getCardWidth = () => {
    return isMobile ? window.innerWidth * 0.45 : window.innerWidth * 0.25;
  };

  // Auto-flip back timer
  useEffect(() => {
    if (!isFlipped) return;
    const timer = setTimeout(() => {
      setIsFlipped(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isFlipped]);

  // Updated Autoplay: Pauses ONLY on drag or flip, NOT on hover
  useEffect(() => {
    if (total === 0 || isDragging || isFlipped) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => prev + 1); // Infinite loop
    }, 1100);
    return () => clearInterval(timer);
  }, [total, isDragging, isFlipped]);

  const getNormalizedOffset = (
    index: number,
    activeIdx: number,
    totalSlides: number
  ) => {
    let offset = index - activeIdx;
    while (offset < -totalSlides / 2) offset += totalSlides;
    while (offset > totalSlides / 2) offset -= totalSlides;
    return offset;
  };

  const updateIndex = (change: number) => {
    setActiveIndex((prev) => prev + change);
    setDragX(0);
    setIsFlipped(false); // Reset flip on slide change
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setDragX(0);
    dragStartTimeRef.current = Date.now();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const diff = e.clientX - startX;
    setDragX(diff);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const dragDuration = Date.now() - dragStartTimeRef.current;
    const cardWidth = getCardWidth();

    let moveCount = -Math.round(dragX / cardWidth);

    if (moveCount === 0 && dragDuration < 300 && Math.abs(dragX) > 40) {
      moveCount = dragX > 0 ? -1 : 1;
    }

    if (moveCount !== 0) {
      updateIndex(moveCount);
    } else {
      // Tap Detection: If very little movement, treat as click
      if (Math.abs(dragX) < 5) {
        setIsFlipped((prev) => !prev);
      }
      setDragX(0);
    }
  };

  const next = () => updateIndex(1);
  const prev = () => updateIndex(-1);
  const dragFraction = dragX / (containerRef.current ? getCardWidth() : 300);
  return (
    <div
      ref={containerRef}
      className="w-full h-full px-0 flex items-center justify-center overflow-hidden perspective-1000 touch-none cursor-grab active:cursor-grabbing relative"
      style={{ width: "100%", position: "relative" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Ambient Background Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div
        className="flex items-center justify-center w-full h-full relative z-10"
        style={{ perspective: "1200px" }}
      >
        {sortedItems.map((item, i) => {
          let offset =
            getNormalizedOffset(i, activeIndex, total) + dragFraction;
          while (offset < -total / 2) offset += total;
          while (offset > total / 2) offset -= total;

          if (Math.abs(offset) > 4.5) return null;

          // --- KEY RESTORATION: Classic clamped rotation ---
          // Limit rotation to max 45 degrees to avoid showing the back
          const rotateY = Math.max(-45, Math.min(45, offset * -45));

          // --- KEY RESTORATION: Standard Spacing ---
          const translateX = offset * 70;

          // --- KEY: Deep Push on Z-axis ---
          // Only push back side cards (abs(offset) > 0.5) to separate them from center
          // Center card stays at 0
          const translateZ = -Math.abs(offset) * 250;

          const zIndex = 20 - Math.round(Math.abs(offset));
          const opacity = 1 - Math.min(Math.abs(offset), 3) * 0.15;

          const scale = 1.0; // Keep scale consistent for classic look

          const isActive = Math.round(offset) === 0;
          const flipped = isActive && isFlipped;

          return (
            <div
              key={i}
              className={`absolute w-[25%] max-sm:w-[45%] ${"aspect-[3/4]"} ease-out shadow-2xl origin-center rounded-6 max-sm:rounded-3 pointer-events-auto `}
              style={{
                transformStyle: "preserve-3d",
                transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${
                  rotateY + (flipped ? 180 : 0)
                }deg) scale(${scale})`,
                zIndex: zIndex,
                opacity: opacity,
                // borderRadius: "12px",
                transitionDuration: isDragging ? "0ms" : "700ms",
              }}
            >
              {/* --- INNER CARD CONTENT (Front & Back) --- */}

              {/* {!flipped &&
                Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                  <div
                    key={`depth-${n}`}
                    className="absolute inset-0 w-full h-full rounded-xl bg-slate-800 border border-slate-700/30"
                    style={{ transform: `translateZ(-${n}px)` }}
                  />
                ))} */}

              {/* FRONT FACE (Image) */}
              <div
                className="absolute inset-0 w-full h-full bg-slate-900 rounded-xl overflow-hidden backface-hidden"
                style={{ transform: "translateZ(0.5px)" }}
              >
                <img
                  src={item?.avatar_url}
                  className="w-full h-full object-cover pointer-events-none"
                  alt=""
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
                />
                <div
                  className="absolute inset-0 bg-black/10 transition-opacity duration-300"
                  style={{ opacity: Math.abs(offset) < 0.5 ? 0 : 0.4 }}
                />

                <div className="absolute top-4 left-4 flex items-center gap-2 max-sm:top-2 max-sm:left-2">
                  <div
                    className="flex items-center gap-1 h-6 bg-[#0000004D] rounded-full px-2"
                    style={{
                      // backdropFilter: "blur(4.186212062835693px)",
                    }}
                  >
                    <FInfoIcon className="size-4 text-white" />
                    <span
                      className="text-xs text-white"
                      style={{
                        fontFamily: "Urbanist",
                        fontWeight: 700,
                        fontSize: 14,
                        letterSpacing: "0.26px",
                        textTransform: "uppercase",
                      }}
                    >
                      {item?.type}
                    </span>
                  </div>
                </div>

                {/* <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10">
                  <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">
                    Item {i + 1}
                  </h3>
                </div> */}
              </div>

              {/* BACK FACE (Info) - Rotated 180deg */}
              <div
                className="absolute inset-0 w-full h-full bg-[#1B1227] rounded-xl overflow-hidden backface-hidden border border-white/30 flex flex-col p-5 max-sm:p-2"
                style={{ transform: "rotateY(180deg) translateZ(0.5px)" }}
              >
                <div className="absolute top-4 left-4 flex items-center gap-2 max-sm:top-2 max-sm:left-0">
                  <div
                    className="flex items-center gap-1 h-6 bg-black/30 rounded-full px-2"
                    style={{
                      // backdropFilter: "blur(4.186212062835693px)",
                    }}
                  >
                    <BInfoIcon className="size-4" />
                    <span
                      className="text-xs text-[#A4ACB9]"
                      style={{
                        fontFamily: "Urbanist",
                        fontWeight: 700,
                        fontSize: 14,
                        letterSpacing: "0.26px",
                        textTransform: "uppercase",
                      }}
                    >
                      {item?.type}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col h-full pt-10 max-sm:pt-6 relative">
                  <div
                    className="flex-shrink-0 text-white font-bold text-[24px] max-lg:text-[20px] max-md:text-[17px] max-sm:text-[14px] mb-1"
                    style={{
                      fontFamily: "Urbanist",
                      fontWeight: 700,
                    }}
                  >
                    {item?.nickname}
                  </div>
                  <div
                    className="mt-2 mb-1 text-[14px] max-sm:text-[10px] text-[#A4ACB9] flex-1 min-h-20 overflow-hidden"
                    style={{
                      fontFamily: "Urbanist",
                      fontWeight: 400,
                      lineHeight: "20px",
                      letterSpacing: "0.26px",
                    }}
                  >
                    { item?.introduction}
                  </div>
                  <div className="flex-shrink-0 flex flex-wrap items-center gap-x-2 gap-y-2.5 min-w-0 min-h-[2rem] max-sm:min-h-[2rem] mt-3 max-sm:mt-2">
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 min-w-0">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <IntimacyIcon className="size-5 max-sm:size-3 text-white" />
                        <span className="text-sm max-sm:text-[12px] text-white font-urbanist whitespace-nowrap">
                          {formatCompactNumber(item?.social?.followed_count || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <HeartIcon className="size-5 max-sm:size-3 text-white" />
                        <span className="text-sm max-sm:text-[12px] text-white font-urbanist whitespace-nowrap">
                          {formatCompactNumber(item?.social?.likes_count || 0)}
                        </span>
                      </div>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        // navigate(`/chat/${item?.id}`);
                        if (!isLogin ) {
                          setOpenAuth(true, "signup");
                          return;
                        }
                        chatSettings.open({
                          cid: item?.id,
                        });
                      }}
                      onPointerDown={(e) => {
                        // 阻止事件冒泡到外层容器，防止触发拖拽
                        e.stopPropagation();
                      }}
                      onPointerMove={(e) => {
                        // 阻止拖拽事件
                        e.stopPropagation();
                      }}
                      onPointerUp={(e) => {
                        // 阻止事件冒泡
                        e.stopPropagation();
                      }}
                      className={`shrink-0 h-9 max-sm:h-8 flex items-center justify-center cursor-pointer hover:bg-white/10 relative group rounded-full px-4 sm:px-5 lg:px-6 gap-[6px] max-sm:px-0 max-sm:w-8`}
                      style={{
                        background:
                          "linear-gradient(180deg, #D9D9D9 0%, #D6B8D4 100%)",
                        boxShadow: "0px 0px 4px 0px #FFFFFF40 inset",
                        touchAction: "none",
                      }}
                    >
                      {!isMobile && (
                        <span className="font-urbanist ml-1 font-bold text-[14px] text-[#12111A]">
                          {t("common.chat")}
                        </span>
                      )}
                      <ChatIcon className="text-[rgba(18,17,26,1)] size-[14px]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* <button
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="absolute left-4 z-30 p-3 bg-black/30 hover:bg-black/50 rounded-full text-white backdrop-blur-sm transition-colors border border-white/10 pointer-events-auto"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-4 z-30 p-3 bg-black/30 hover:bg-black/50 rounded-full text-white backdrop-blur-sm transition-colors border border-white/10 pointer-events-auto"
      >
        <ChevronRight size={24} />
      </button> */}
    </div>
  );
};

export default CoverFlow;
