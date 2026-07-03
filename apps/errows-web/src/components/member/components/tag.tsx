import type { MemberType } from '@/types';
import React from 'react';
import { motion } from 'motion/react';
import { cva, type VariantProps } from "class-variance-authority"
import { MEMBER_CONFIG } from '@/config';
import { gradientConfig, tagColorConfig, iconConfig } from '../config';
import { cn } from '@errows/design/lib/utils';

const variants = cva(
  'relative overflow-hidden inline-flex justify-center items-center font-bold rounded-md',
  {
    variants: {
      size: {
        default: 'h-6 px-2 text-sm gap-1',
        mini: 'h-4 px-1 text-xs',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

interface MemberTagProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof variants> {
  type?: MemberType;
}

const points = [
  { left: '10%', opacity: 1, delay: 0.2, duration: 2.35 },
  { left: '30%', opacity: 0.7, delay: 0.5, duration: 2.5 },
  { left: '25%', opacity: 0.8, delay: 0.1, duration: 2.2 },
  { left: '44%', opacity: 0.6, delay: 0.1, duration: 2.05 },
  { left: '50%', opacity: 1, delay: 0.2, duration: 1.9 },
  { left: '75%', opacity: 0.5, delay: 1.5, duration: 1.5 },
  { left: '88%', opacity: 0.9, delay: 0.2, duration: 2.2 },
  { left: '58%', opacity: 0.8, delay: 0.2, duration: 2.25 },
  { left: '98%', opacity: 0.6, delay: 0.1, duration: 2.6 },
  { left: '65%', opacity: 1, delay: 0.2, duration: 2.5 },
]

export function MemberTag(props: MemberTagProps) {
  const { type = 'star', className, style, size, ...rest } = props;

  const { title } = MEMBER_CONFIG[type];
  const color = tagColorConfig[type];
  const Icon = iconConfig[type];

  return (
    <div
      className={cn(variants({ size, className }))}
      style={{
        background: gradientConfig[type],
        color,
        ...style,
      }}
      {...rest}
    >
      {type === 'luna' && (
        <motion.div
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/60 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {type === 'galaxy' && (
        <div className="absolute w-full h-full top-0 left-0">
          {points.map((b, i) => (
            <motion.div
              key={`bubble-${i}`}
              className="absolute w-0.5 h-0.5 -bottom-2.5 rounded-full bg-white"
              style={{
                left: b.left,
                opacity: b.opacity,
              }}
              initial={{ y: 0 }}
              animate={{ y: -55 }}
              transition={{
                duration: 4 + i * 0.6,
                delay: b.delay,
                repeat: Infinity,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}

      <Icon
        className={cn(size === 'mini' ? 'w-3 h-3' : 'w-4 h-4')}
        style={{ color }}
      />
      <span style={{ scale: size === 'mini' ? 0.85 : undefined }}>{title}</span>
    </div>
  )
}

