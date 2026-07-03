"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@errows/design/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, checked, ...props }, ref) => {

  return (
    <SwitchPrimitives.Root
      ref={ref}
      checked={checked}
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        width: '26px',
        height: '14px',
        background: checked
          ? "linear-gradient(135deg, #DD429D 0%, #B14BF4 100%)"
          : "#4B5563",
      }}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform"
        )}
        style={{
          width: '10px',
          height: '10px',
          transform: checked ? 'translateX(14px)' : 'translateX(2px)',
        }}
      />
    </SwitchPrimitives.Root>
  );
});

Switch.displayName = "Switch";

export { Switch };
