import React from "react";
import { Loader2 } from "lucide-react";
interface HistoryItemProps {
  direction: "justify-start" | "justify-end" | "justify-center";
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
}
/*
  聊天布局组件
  支持三种布局：
  1. 左对齐
  2. 右对齐
  3. 居中对齐
*/
export const HistoryItem: React.FC<
  React.PropsWithChildren<HistoryItemProps>
> = (props) => {
  const { direction, children, className, style, loading } = props;
  return (
    <div
      className={`flex w-full ${direction} ${className}`}
      style={{
        // paddingRight: direction === "justify-start" ? "97px" : "0",
        // paddingLeft: direction === "justify-end" ? "97px" : "0",
        ...style,
      }}
    >
      {direction === "justify-start" && (
        <>
          {children}
          <div className="flex items-center justify-start w-[97px] max-sm:w-0 max-sm:overflow-hidden max-sm:pl-0 shrink-0 pl-4">
            {loading && (
              <Loader2 className="w-4 h-4 text-[#A4ACB9] animate-spin" />
            )}
          </div>
        </>
      )}
      {direction === "justify-end" && (
        <>
          <div className="flex items-center justify-end w-[97px] max-sm:w-0 max-sm:overflow-hidden max-sm:pr-0 shrink-0 pr-4">
            {loading && (
              <Loader2 className="w-4 h-4 text-[#A4ACB9] animate-spin" />
            )}
          </div>
          {children}
        </>
      )}
      {direction === "justify-center" && (
        <>
          {children}
        </>
      )}
    </div>
  );
};

interface MessageItemProps {
  className?: string;
  style?: React.CSSProperties;
}

/*
  角色文字消息容器
*/
export const CharacterMessageItem: React.FC<
  React.PropsWithChildren<MessageItemProps>
> = (props) => {
  const { children, style, className } = props;
  return (
    <div
      className={`bg-[#2c2c38b3] rounded-tl-[16px] rounded-tr-[16px] rounded-br-[16px] rounded-bl-[16px] min-w-[146px] pb-2 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

/*
  用户文字消息容器
*/
export const UserMessageItem: React.FC<
  React.PropsWithChildren<MessageItemProps>
> = (props) => {
  const { children, style, className } = props;
  return (
    <div
      className={`bg-[#2C203Fb3] rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[16px] rounded-br-[16px] min-w-[146px] pb-2 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};
