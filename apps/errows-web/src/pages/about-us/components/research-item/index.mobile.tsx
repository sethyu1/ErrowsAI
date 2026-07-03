import { cn } from "@errows/design/lib/utils";
import React from "react";

export interface ResearchItemProps {
  className?: string;
  style?: React.CSSProperties;
  title: string;
  description: string;
  image: string;
}

export const ResearchItemMobile: React.FC<ResearchItemProps> = (props) => {
  const { className, style, title, description, image } = props;
  return (
    <div className={cn("flex gap-3", className)} style={style}>
      <div className="flex flex-col gap-2">
        <div className="shrink-0 font-urbanist font-semibold text-[18px]">
          {title}
        </div>
        <div className="font-urbanist font-normal text-[12px] leading-[16px] text-justify text-[#A4ACB9]">
          {description}
        </div>
      </div>
      <img src={image} alt={title} className="size-[95px] rounded-[18px]" />
    </div>
  );
};
