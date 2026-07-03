"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon } from "lucide-react"
import { ArrowRightFillIcon, ArrowBottomFillIcon, CloseIcon } from "@errows/icons"

import { cn } from "@errows/design/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  children,
  icon = <ArrowBottomFillIcon className="size-4 shrink-0 text-[#F5F5F5] opacity-70" />,
  onClear,
  showClearIcon,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & { icon?: React.ReactNode; onClear?: () => void; showClearIcon?: boolean }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-[38px] w-full items-center justify-between gap-2 rounded-full border border-[#2C2C38] bg-[#0E0F17] px-4 py-2 text-sm font-medium text-[#F5F5F5] shadow-sm transition-all outline-none",
        "hover:bg-[#1A1B23] hover:border-[#3C3C48]",
        "focus:border-[#3C3C48] focus:ring-2 focus:ring-[#3C3C48]/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=open]:border-[#3C3C48] data-[state=open]:ring-2 data-[state=open]:ring-[#3C3C48]/20",
        "[&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <div className="flex items-center gap-1 pointer-events-none">
        {showClearIcon && onClear && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClear();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="flex items-center justify-center rounded hover:bg-[#2C2C38] transition-colors cursor-pointer pointer-events-auto"
            role="button"
            tabIndex={-1}
            aria-label="清除选择"
          >
            <CloseIcon className="size-3 text-[#F5F5F5] opacity-70 hover:opacity-100" />
          </div>
        )}
        <div className="pointer-events-auto">
          <SelectPrimitive.Icon asChild>
           {icon}
          </SelectPrimitive.Icon>
        </div>
      </div>
    </SelectPrimitive.Trigger>
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ArrowRightFillIcon className="size-4 -rotate-90" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ArrowBottomFillIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border border-[#2C2C38] bg-[#1F1F27] text-[#F5F5F5] shadow-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-slot="select-viewport"
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-2 py-1.5 text-xs font-semibold text-[#A4ACB9]",
        className
      )}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none transition-colors",
        "hover:bg-[#2C2C38] hover:text-[#F5F5F5]",
        "focus:bg-[#2C2C38] focus:text-[#F5F5F5]",
        "data-[state=checked]:bg-[#2C2C38] data-[state=checked]:text-[#F5F5F5]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-[#2C2C38] -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
