
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";



const Film: React.FC<React.PropsWithChildren<{ className?: string, characters: API.Character.CHARACTER[] }>> = (props) => {
  const { className, characters } = props;
  const { children } = props;
  const isMobile = useIsMobile();


  // 将图片按列分组，每列显示图片
  const columns = 10; // 增加列数
  const columnsData: API.Character.CHARACTER[][] = [];

  for (let i = 0; i < columns; i++) {
    columnsData.push([]);
  }

  // 如果图片不够，重复使用图片来填充
  const minItemsPerColumn = 8; // 每列至少8个图片
  const totalNeeded = columns * minItemsPerColumn;
  let characterIndex = 0;

  for (let i = 0; i < totalNeeded; i++) {
    if (characters.length > 0) {
      const character =
      characters[characterIndex % characters.length];
      columnsData[i % columns].push(character);
      characterIndex++;
    }
  }

  return (
    <div className={`w-full h-[550px] flex items-center justify-center relative overflow-hidden ${className}`}>
      {/* 渐变蒙层 */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #0E0F17 0%, rgba(14, 15, 23, 0) 18.27%, rgba(14, 15, 23, 0) 81.25%, #0E0F17 100%)',
        }}
      />
      <style>
        {`
          @keyframes scrollDown {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(calc(-100% / 3));
            }
          }
          @keyframes scrollUp {
            0% {
              transform: translateY(calc(-100% / 3));
            }
            100% {
              transform: translateY(0);
            }
          }
          .scroll-column-down {
            animation: scrollDown 100s linear infinite;
          }
          .scroll-column-up {
            animation: scrollUp 100s linear infinite;
          }
          .scroll-column-down:hover,

        `}
        {/* .scroll-column-up:hover {
            animation-play-state: paused;
          } */}
      </style>
      {/* -rotate-45 */}
      <div
        className={`flex absolute top-1/2 left-1/2 -translate-x-1/2 -rotate-35 -translate-y-1/2`}
        style={{ 
          width: "max-content",
          gap: isMobile ? "27px" : "20px"
        }}
      >
        {columnsData.map((columnCharacters, columnIndex) => {
          // 奇数列向下滚动，偶数列向上滚动
          const isDown = columnIndex % 2 === 0;
          const animationClass = isDown
            ? "scroll-column-down"
            : "scroll-column-up";

          // 移动端缩小1.5倍
          const imageWidth = isMobile ? "193px" : "290px";
          const imageHeight = isMobile ? "287px" : "430px";
          const borderRadius = isMobile ? "15px" : "23px";
          const columnGap = isMobile ? "27px" : "20px";

          return (
            <div
              key={columnIndex}
              className={`flex flex-col opacity-50 ${animationClass}`}
              style={{ gap: columnGap }}
            >
              {/* 第一组图片 */}
              {columnCharacters.map((character, idx) => (
                <div
                  key={`${character.id}-1-${idx}`}
                  className="flex-shrink-0"
                  style={{ width: imageWidth, height: imageHeight }}
                >
                  <img
                    src={character.avatar_url}
                    alt={character.nickname}
                    className="w-full h-full object-cover"
                    style={{ borderRadius }}
                  />
                </div>
              ))}
              {/* 第二组图片（用于无缝循环） */}
              {columnCharacters.map((character, idx) => (
                <div
                  key={`${character.id}-2-${idx}`}
                  className="flex-shrink-0"
                  style={{ width: imageWidth, height: imageHeight }}
                >
                  <img
                    src={character.avatar_url}
                    alt={character.nickname}
                    className="w-full h-full object-cover"
                    style={{ borderRadius }}
                  />
                </div>
              ))}
              {/* 第三组图片（提前补齐，确保无缝循环） */}
              {columnCharacters.map((character, idx) => (
                <div
                  key={`${character.id}-3-${idx}`}
                  className="flex-shrink-0"
                  style={{ width: imageWidth, height: imageHeight }}
                >
                  <img
                    src={character.avatar_url}
                    alt={character.nickname}
                    className="w-full h-full object-cover"
                    style={{ borderRadius }}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {children}
    </div>
  );
};

export default Film;
