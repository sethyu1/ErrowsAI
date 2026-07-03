import React from "react";
import { CheckIcon } from "@errows/icons";
import { cn } from "@errows/design/lib/utils";

interface ChatItemProps {
  className?: string;
  text: string;
}
export const ChatItem: React.FC<ChatItemProps> = ({ className, text }) => {
  return (
    <div className={cn("flex gap-4 items-center", className)}>
      <CheckIcon className="size-6 max-sm:size-4 " />
      <span className="font-urbanist font-normal text-[18px] leading-[28px] text-[#F5F5F5]">
        {text}
      </span>
    </div>
  );
};
