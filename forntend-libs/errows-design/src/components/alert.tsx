"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon, InfoIcon, AlertCircleIcon, AlertTriangleIcon } from "lucide-react"
import { cn } from "@errows/design/lib/utils"
import { Button } from "./button.js"

type AlertType = "info" | "error" | "warning"

interface AlertDialogProps {
  /** 是否打开 */
  open?: boolean
  /** 打开状态变化回调 */
  onOpenChange?: (open: boolean) => void
  /** 标题 */
  title: string
  /** 内容 */
  content: string | React.ReactNode
  /** 类型 */
  type?: AlertType
  /** 确认按钮文本 */
  confirmText?: string
  /** 取消按钮文本 */
  cancelText?: string
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** 确认回调 */
  onConfirm?: () => void
  /** 取消回调 */
  onCancel?: () => void
  /** 自定义类名 */
  className?: string
  /** 触发器子元素（新增：支持包裹模式） */
  children?: React.ReactNode
}

const alertTypeConfig = {
  info: {
    icon: InfoIcon,
    color: "#485CFB",
    bgColor: "rgba(72, 92, 251, 0.1)",
  },
  error: {
    icon: AlertCircleIcon,
    color: "#DD429D",
    bgColor: "rgba(221, 66, 157, 0.1)",
  },
  warning: {
    icon: AlertTriangleIcon,
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.1)",
  },
}

function AlertDialog({
  open: controlledOpen,
  onOpenChange,
  title,
  content,
  type = "info",
  confirmText = "ok",
  cancelText = "cancel",
  showCancel = false,
  onConfirm,
  onCancel,
  className,
  children,
}: AlertDialogProps) {
  // 内部状态管理（用于Trigger模式）
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  // 判断是否为受控模式
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  const config = alertTypeConfig[type]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm?.()
    handleOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    handleOpenChange(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      {/* 如果有children，渲染为Trigger */}
      {children && (
        <DialogPrimitive.Trigger asChild>
          {children}
        </DialogPrimitive.Trigger>
      )}
      
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[99999] bg-black/50"
        />
        <DialogPrimitive.Content
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[99999] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] shadow-lg duration-200 sm:max-w-md",
            className
          )}
          style={{
            background: "#1B1227",
            border: "1px solid #FFFFFF4D",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          {/* 关闭按钮 */}
          <DialogPrimitive.Close
            className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none text-white"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* 图标 */}
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto"
            style={{ backgroundColor: config.bgColor }}
          >
            <Icon className="size-6" style={{ color: config.color }} />
          </div>

          {/* 标题 */}
          <DialogPrimitive.Title
            className="text-xl font-bold text-white text-center mb-3"
            style={{ fontFamily: "Urbanist, sans-serif" }}
          >
            {title}
          </DialogPrimitive.Title>

          {/* 内容 */}
          <DialogPrimitive.Description
            className="text-sm text-gray-300 text-center mb-6"
            style={{ fontFamily: "Urbanist, sans-serif" }}
          >
            {content}
          </DialogPrimitive.Description>

          {/* 按钮组 */}
          <div className="flex gap-3 justify-center">
            {showCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="min-w-[100px]"
                shape="round"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              className="min-w-[100px]"
              appearance="gradientFill"
              shape="round"
            >
              {confirmText}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { AlertDialog }
export type { AlertDialogProps, AlertType }
