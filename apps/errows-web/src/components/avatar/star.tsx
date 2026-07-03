import { motion } from 'motion/react';
import { cn } from '@errows/design/lib/utils';
import { cva, type VariantProps } from "class-variance-authority"

const variants = cva(
  'absolute z-1000',
  {
    variants: {
      size: {
        default: "w-0.75 h-0.75",
        sm: "w-0.5 h-0.5",
        lg: "w-1.25 h-1.25",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface StarProps {
  color?: string
  className?: string
  style?: React.CSSProperties
  duration?: number
  delay?: number
}

export function Star(props: StarProps & VariantProps<typeof variants>) {
  const {
    size,
    color = '#fff',
    className,
    style,
    duration = 2.4,
    delay = 0,
  } = props

  return (
    <motion.div
      className={cn(variants({ size, className }))}
      //@ts-ignore
      style={{
        color: color,
        boxShadow: `0 0 40px 0 ${color}, 0 0 20px 0 rgba(237, 205, 163, 0.8)`,
        ...style,
      }}
      initial={{ opacity: 0.3, scale: 1 }}
      animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.6, 1] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 1024 1024" width="100%" height="100%" fill="currentColor">
        <path d="M512 736.981333L775.68 896l-69.76-299.904L938.666667 394.410667l-306.816-26.325334L512 85.333333 392.149333 368.085333 85.333333 394.410667l232.746667 201.685333L248.32 896z" />
      </svg>
    </motion.div>
  )
}
