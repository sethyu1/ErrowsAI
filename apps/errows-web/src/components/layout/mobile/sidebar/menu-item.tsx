import React from 'react';
import { cn } from '@errows/design/lib/utils';

interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  onClick?: () => void;
}

export function MenuItem(props: MenuItemProps) {
  const { title, icon: Icon, onClick, className, ...rest } = props;
  return (
    <div
      className={cn(
        'flex h-12 items-center gap-4.5 cursor-pointer pl-4',
        className
      )}
      {...rest}
      onClick={onClick}
    >
      <Icon className="size-[22px]" />
      <span className="text-sm leading-5.5">
        {title}
      </span>
    </div>
  );
}

