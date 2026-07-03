import React from 'react';
import { cn } from '@errows/design/lib/utils';

interface ActiveItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  onClick?: () => void;
}

export function ActiveItem(props: ActiveItemProps) {
  const { title, icon: Icon, onClick, className, ...rest } = props;

  return (
    <div
      className={cn(
        'flex h-5.5 leading-5.5 items-center gap-4 cursor-pointer',
        className
      )}
      {...rest}
      onClick={onClick}
    >
      <Icon className="size-4 text-[#A4ACB9]" />
      <span className="leading-5.5 text-[14px]">
        {title}
      </span>
    </div>
  );
}

