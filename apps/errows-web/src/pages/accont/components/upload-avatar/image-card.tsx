import type React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@errows/design/lib/utils';

interface ImageCardProps extends React.ComponentProps<'div'> {
  url?: string;
  active?: boolean;
}

const variants = cva(
  'w-35 rounded-lg overflow-hidden cursor-pointer',
  {
    variants: {
      active: {
        false: null,
        true: 'border-2 border-white border-solid',
      }
    },
    defaultVariants: {
      active: false,
    },
  }
)

export function ImageCard(props: ImageCardProps) {
  const { url, active, className, ...rest  } = props;

  return (
    <div
      className={cn(variants({ active, className }))}
      {...rest}
    >
      <img className="w-full h-full" src={url}  />
    </div>
  )
}
