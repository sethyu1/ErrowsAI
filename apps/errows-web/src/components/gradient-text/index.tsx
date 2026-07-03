import { cn } from '@errows/design/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GradientTexProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function GradientText(props: GradientTexProps) {
  const { className, ...rest } = props;

  return (
    <span className={cn('text-errows-gradient-primary', className)} {...rest} />
  )
}
