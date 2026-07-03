import { motion } from 'motion/react';
import { PinkStarIcon } from "@errows/icons";

const BtnSize = 38;

export const GeneratingIcon = (props: {
    onClick: () => void;
}) => {
    const { onClick } = props;
    return (
        <div
            className="relative flex justify-center items-center cursor-pointer"
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            style={{
                width: BtnSize,
                height: BtnSize,
                backgroundColor: '#df90ff47',
                borderRadius: '50%',
            }}
        >
            {/* 旋转的渐变边框 */}
            <motion.svg
                className="absolute"
                style={{
                    width: BtnSize,
                    height: BtnSize,
                }}
                viewBox={`0 0 ${BtnSize} ${BtnSize}`}
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 3,
                }}
            >
                <defs>
                    <linearGradient
                        id="borderGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#9C42C3" stopOpacity="1" />
                        <stop offset="25%" stopColor="#C668E8" stopOpacity="1" />
                        <stop offset="50%" stopColor="#E0B8F0" stopOpacity="1" />
                        <stop offset="75%" stopColor="#C668E8" stopOpacity="1" />
                        <stop offset="100%" stopColor="#9C42C3" stopOpacity="1" />
                    </linearGradient>
                </defs>
                {/* 圆形边框 */}
                <circle
                    cx={BtnSize / 2}
                    cy={BtnSize / 2}
                    r={BtnSize / 2 - 1.5}
                    fill="none"
                    stroke="url(#borderGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
            </motion.svg>

            {/* 中心内容容器 */}
            <div
                className="relative flex justify-center items-center"
                style={{
                    width:BtnSize,
                    height: BtnSize,
                    zIndex: 10,
                    transform: 'translate(2px, -2px)',
                }}
            >
                <PinkStarIcon className="w-[15px] h-[15px]" />
                <div className="absolute" style={{
                    left: 10,
                    bottom: 6,
                }}>
                    <PinkStarIcon className="w-[6px] h-[6px]" />
                </div>
            </div>
        </div>
    );
};
