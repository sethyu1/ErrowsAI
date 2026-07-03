import React from "react";
import type { ResearchItemProps } from "./index.mobile";
import { cn } from "@errows/design/lib/utils";
import { useMobile } from "@/hooks/use-mobile-detector";
import { ResearchItemMobile } from "./index.mobile";

export const ResearchItem: React.FC<ResearchItemProps> = (props) => {
  const { className, style, title, description, image } = props;
  return (
    <div className={cn("flex gap-3", className)} style={style}>
      <div className="flex flex-col gap-5">
        <div className="w-[121px] h-[52px] bg-[#22232A] shrink-0 rounded-[100px] flex items-center justify-center font-urbanist font-semibold text-[18px]">
          {title}
        </div>
        <div className="font-urbanist font-normal text-[16px] leading-[32px] text-justify text-[#A4ACB9]">
          {description}
        </div>
      </div>
      <img src={image} alt={title} className="size-40 rounded-[30px]" />
    </div>
  );
};

export default (props: ResearchItemProps) => {
  const isMobile = useMobile();
  return isMobile ? (
    <ResearchItemMobile {...props} />
  ) : (
    <ResearchItem {...props} />
  );
};
