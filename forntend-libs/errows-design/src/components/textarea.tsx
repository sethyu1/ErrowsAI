import * as React from "react"

import { cn } from "@errows/design/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  autoResize?: boolean;
  minHeight?: number | string;
  maxHeight?: number | string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, minHeight, maxHeight, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // 自动调整 textarea 高度
    React.useEffect(() => {
      if (!autoResize) return;

      const textarea = textareaRef.current;
      if (textarea) {
        const value = props.value || "";
        const minHeightPx = minHeight ? (typeof minHeight === "number" ? minHeight : parseInt(minHeight)) : 0;
        
        // 如果内容为空，使用 minHeight
        if (!value) {
          textarea.style.height = minHeightPx ? `${minHeightPx}px` : "auto";
          return;
        }

        // 重置高度以获取正确的 scrollHeight
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        
        // 如果只有一行且 scrollHeight 小于等于单行高度（约70px），使用 minHeight
        // 这样可以保证没有换行符且文字不长的情况下显示为 40px
        const hasLineBreak = value.toString().includes('\n');
        const singleLineThreshold = 70; // 单行的大致高度阈值（包含padding）
        
        if (!hasLineBreak && scrollHeight <= singleLineThreshold && minHeightPx) {
          textarea.style.height = `${minHeightPx}px`;
          return;
        }

        // 有多行内容时，根据 scrollHeight 计算
        let newHeight = scrollHeight;

        // 处理最小高度
        if (minHeightPx) {
          newHeight = Math.max(newHeight, minHeightPx);
        }

        // 处理最大高度
        if (maxHeight) {
          const maxHeightPx = typeof maxHeight === "number" ? maxHeight : parseInt(maxHeight);
          newHeight = Math.min(newHeight, maxHeightPx);
        }
        
        textarea.style.height = `${newHeight}px`;
      }
    }, [props.value, autoResize, minHeight, maxHeight, textareaRef]);

    // 合并样式，确保 minHeight 和 maxHeight 格式正确
    const style: React.CSSProperties = {
      ...props.style,
    };

    if (minHeight) {
      style.minHeight = typeof minHeight === "number" ? `${minHeight}px` : minHeight;
    }

    if (maxHeight) {
      style.maxHeight = typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;
    }

    return (
      <textarea
        ref={textareaRef}
        data-slot="textarea"
        className={cn(
          "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          autoResize ? "resize-none overflow-hidden" : "resize-y min-h-[80px]",
          className
        )}
        style={style}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea }
