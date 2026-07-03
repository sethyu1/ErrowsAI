import * as React from "react";
import { Textarea } from "./textarea.js";
import { cn } from "@errows/design/lib/utils";

interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function InputGroup({ className, children, ...props }: InputGroupProps) {
  return (
    <div
      className={cn(
        "border-input focus-within:border-ring focus-within:ring-ring/50 flex h-9 w-full items-center rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function InputGroupAddon({
  className,
  children,
  ...props
}: InputGroupAddonProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex items-center whitespace-nowrap px-3 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface InputGroupInputProps extends React.ComponentProps<"input"> {}

function InputGroupInput({ className, type, ...props }: InputGroupInputProps) {
  return (
    <input
      type={type}
      className={cn(
        "placeholder:text-muted-foreground file:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex-1 bg-transparent px-3 py-1 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return <Textarea className={cn(className)} {...props} />;
}

export { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea };
