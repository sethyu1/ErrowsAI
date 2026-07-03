import { cn } from "@errows/design/lib/utils";

interface BaseContainerProps {
  fluid?: boolean;
  use2Xl?: boolean;
  useXl?: boolean;
  useLg?: boolean;
  useMd?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function BaseContainer({
  fluid = false,
  use2Xl = true,
  useXl = true,
  useLg = true,
  useMd = true,
  className,
  children,
}: BaseContainerProps) {
  const containerClass = fluid
    ? "w-full"
    : cn(
        useMd && "md:max-w-[864px]",
        useLg && "lg:max-w-[1080px]",
        useXl && "xl:max-w-[1280px]",
        use2Xl && "2xl:max-w-[1500px]"
      );
  return (
    <div className={cn("mx-auto w-full", containerClass, className)}>
      {children}
    </div>
  );
}
