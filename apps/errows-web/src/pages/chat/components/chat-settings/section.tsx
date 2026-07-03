import React from "react";

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  className?: string;
}

export const Section = ({ title, icon, className }: SectionProps) => {
  return (
    <div className={`flex items-center gap-2 mb-4 ${className}`}>
      <div className="w-4 h-4">{icon}</div>
      <span className="text-sm font-urbanist font-normal font-size-[16px] text-[#A4ACB9] leading-none line-height-[22px] letter-spacing-0">
        {title}
      </span>
    </div>
  );
};
