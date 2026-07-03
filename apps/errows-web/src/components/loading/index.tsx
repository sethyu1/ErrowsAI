import { motion } from 'motion/react';
import React from 'react';

export type LoadingVariant = 'color' | 'gray';

const CIRCLE_CX = 13;
const CIRCLE_CY = 13;
const CIRCLE_R = 11;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

export interface LoadingProps extends React.SVGProps<HTMLDivElement> {
  variant?: LoadingVariant;
  progressPercent?: number;
}

export const Loading = ({ variant = 'color', progressPercent, ...props }: LoadingProps) => {
  const isGray = variant === 'gray';
  const gradientId = isGray ? 'gray-gradient' : 'flowing-gradient';
  const filterId = isGray ? 'gray-glow' : 'glow';

  if (isGray) {
    const hasProgress = progressPercent != null;
    const percent = Math.min(100, Math.max(0, progressPercent ?? 0));
    const dash = (percent / 100) * CIRCLE_CIRCUMFERENCE;
    const gap = CIRCLE_CIRCUMFERENCE - dash;
    return (
      <div
        {...props}
        style={{
          ...props.style,
          display: 'inline-flex',
          width: '1em',
          height: '1em',
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.svg
          width="100%"
          height="100%"
          viewBox="0 0 26 26"
          fill="none"
          style={{ overflow: 'visible', transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}
          animate={hasProgress ? {} : { rotate: 360 }}
          transition={hasProgress ? {} : { repeat: Infinity, ease: 'linear', duration: 1 }}
        >
          <circle
            cx={CIRCLE_CX}
            cy={CIRCLE_CY}
            r={CIRCLE_R}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx={CIRCLE_CX}
            cy={CIRCLE_CY}
            r={CIRCLE_R}
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="2"
            fill="none"
            strokeDasharray={hasProgress ? `${dash} ${gap}` : `${CIRCLE_CIRCUMFERENCE * 0.25} ${CIRCLE_CIRCUMFERENCE * 0.75}`}
            strokeDashoffset="0"
          />
        </motion.svg>
      </div>
    );
  }

  return (
    <div
      {...props}
      style={{
        ...props.style,
        display: 'inline-block',
        width: '1em',
        height: '1em',
        position: 'relative',
      }}
    >
      <motion.svg
        width="1em"
        height="1em"
        viewBox="0 0 120 121"
        fill="none"
        style={{
          overflow: 'visible',
        }}
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <motion.stop
              offset="0%"
              animate={{
                stopColor: [
                  '#DD429D',
                  '#B14BF4',
                  '#485CFB',
                  '#B14BF4',
                  '#DD429D',
                ],
              }}
              transition={{
                duration: 4,
                ease: 'linear',
                repeat: Infinity,
                repeatType: 'loop',
              }}
            />
            <motion.stop
              offset="33%"
              animate={{
                stopColor: [
                  '#B14BF4',
                  '#485CFB',
                  '#DD429D',
                  '#B14BF4',
                  '#B14BF4',
                ],
              }}
              transition={{
                duration: 4,
                ease: 'linear',
                repeat: Infinity,
                repeatType: 'loop',
              }}
            />
            <motion.stop
              offset="66%"
              animate={{
                stopColor: [
                  '#485CFB',
                  '#DD429D',
                  '#B14BF4',
                  '#485CFB',
                  '#485CFB',
                ],
              }}
              transition={{
                duration: 4,
                ease: 'linear',
                repeat: Infinity,
                repeatType: 'loop',
              }}
            />
            <motion.stop
              offset="100%"
              animate={{
                stopColor: [
                  '#B14BF4',
                  '#DD429D',
                  '#485CFB',
                  '#DD429D',
                  '#B14BF4',
                ],
              }}
              transition={{
                duration: 4,
                ease: 'linear',
                repeat: Infinity,
                repeatType: 'loop',
              }}
            />
          </linearGradient>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M60.0494 0C92.6677 0 120 27.2003 120 59.8005C120 93.4005 92.8671 121 60.0494 121C27.132 121 0.000113569 93.4005 0 59.8005C0 27.2004 27.3314 0.000121947 60.0494 0ZM59.7979 40.208C52.6714 23.0023 20.3496 25.923 20.3495 52.6881C20.3497 66.1864 30.4728 84.148 60.0494 102.451C89.626 84.148 99.7502 66.1864 99.7504 52.6881C99.7503 26.1213 67.57 22.9128 60.3379 40.118C61.6543 52.6572 67.9324 59.018 81.616 59.0182C60.0691 59.0186 62.7422 80.5915 60.0685 92.6406C57.3916 80.5914 60.0684 59.0182 38.521 59.0182C52.1996 59.0182 58.4781 52.8696 59.7979 40.208Z"
          fill={`url(#${gradientId})`}
          filter={`url(#${filterId})`}
          style={{
            transformOrigin: 'center center',
          }}
          animate={{
            opacity: [0.9, 1, 0.9],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'loop',
          }}
        />
      </motion.svg>
    </div>
  );
};
