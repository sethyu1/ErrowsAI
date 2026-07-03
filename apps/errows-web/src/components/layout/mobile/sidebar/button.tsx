import { cn } from '@errows/design/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ButtonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Button(props: ButtonProps) {
  const { className, children, ...rest } = props;

  return (
    <div
      className={cn(
        'flex h-11 w-full leading-11 items-center justify-center gap-2 cursor-pointer rounded-lg',
        'bg-[rgba(35,35,46,1)]',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
