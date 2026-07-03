import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  Children,
} from "react";
import { Button } from "@errows/design";
import { useDrag } from "@use-gesture/react";
import { ArrowLeftIcon } from "@errows/icons";
import { CoverFlow} from "../cover-flow2";

export interface CarouselExProps {
  // images: Item[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  items: API.Character.CHARACTER[];
  onItemClick?: (item: API.Character.CHARACTER) => void;
  loading?: boolean;
}

export const CarouselEx: React.FC<React.PropsWithChildren<CarouselExProps>> = (
  props
) => {
  const { items, children, autoPlay = true, autoPlayInterval = 1000, onItemClick, loading = false } = props;

  const [currentIndex, setCurrentIndex] = useState(0);
  // const coverFlowRef = useRef<CoverFlowRef | null>(null);

  // const handlePrev = () => {
  //   console.log("handlePrev");
  //   coverFlowRef.current?.handlePrev();
  // };

  // const handleNext = () => {
  //   console.log("handleNext");
  //   coverFlowRef.current?.handleNext();
  // };

  const currentCharacter = items[currentIndex];

  // // 使用 useDrag 手势库监听滑动
  // const bind = useDrag(
  //   ({ swipe: [swipeX], last }) => {
  //     // swipeX: -1 表示向左滑动（显示下一张），1 表示向右滑动（显示上一张）
  //     if (last && swipeX !== 0) {
  //       if (swipeX === -1) {
  //         // 向左滑动，显示下一张
  //         handleNext();
  //       } else if (swipeX === 1) {
  //         // 向右滑动，显示上一张
  //         handlePrev();
  //       }
  //       // resetAutoPlayTimer();
  //     }
  //   },
  //   {
  //     // 配置选项
  //     axis: "x", // 只监听水平方向
  //     swipe: {
  //       distance: 50, // 滑动距离阈值（像素）
  //       velocity: 0.3, // 滑动速度阈值
  //     },
  //   }
  // );

  // // 自动播放效果



  return (
    <div className="relative w-full flex flex-col">
      {/* 底部模糊背景图片 - 覆盖整个根节点 */}
      {/* <div className="absolute inset-0 z-0 overflow-hidden w-full h-full">
        {currentCharacter && (
          <>
            <img
              src={currentCharacter.avatar_url}
              // src={items?.[0]?.avatar_url}
              alt="Background"
              className="w-full h-full object-cover transition-all duration-500"
              style={{
                filter: "blur(40px) brightness(0.8)",
                transform: "scale(1.1)", // 放大一点避免边缘模糊不够
              }}
            />

            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(14, 15, 23, 0.5) 0%, rgba(14, 15, 23, 0.8) 100%)",
              }}
            />
          </>
        )}
      </div> */}

      {/* 内容区域 */}
      <div className="relative z-10">{children}</div>

      <div className="w-full relative z-10 mt-[52px] max-sm:mt-[15px] h-[35vw] max-h-[560px] max-sm:h-[65vw]">
        {/* 轮播容器 */}
        <CoverFlow
          items={items}
          // className="flex-shrink-0 "
          // currentIndex={currentIndex}
          // setCurrentIndex={setCurrentIndex}
          // onItemClick={onItemClick}
          // ref={coverFlowRef}
          // loading={loading}
          // autoPlay={autoPlay}
          // autoPlayInterval={autoPlayInterval}
        ></CoverFlow>

        {/* 左右切换按钮 - 放在下方 */}
        {/* <div
          className="relative z-20 flex items-center justify-center gap-[14px] pt-5 bg-[#15151E]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(14, 15, 23, 0.5) 0%, rgba(14, 15, 23, 0.8) 100%)",
          }}
        >
          <Button
            onClick={() => {
              handlePrev();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-[#2C2C38] hover:scale-110 hover:border-[#3C3C48]"
            style={{
              border: "0.62px solid #2C2C38",
              background: "#22232A",
            }}
            aria-label="Previous"
          >
            <ArrowLeftIcon className="text-white text-sm transition-transform duration-300 group-hover:-translate-x-0.5" />
          </Button>
          <Button
            onClick={() => {
              handleNext();
            }}
            className="w-8 h-8 transform rotate-180 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-[#2C2C38] hover:scale-110 hover:border-[#3C3C48]"
            style={{
              border: "0.62px solid #2C2C38",
              background: "#22232A",
            }}
            aria-label="Next"
          >
            <ArrowLeftIcon className=" text-white text-sm transition-transform duration-300 group-hover:translate-x-0.5" />
          </Button>
        </div> */}
      </div>
    </div>
  );
};
