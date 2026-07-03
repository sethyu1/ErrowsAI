import React, { useState } from "react";
import { ModelSelectIcon, AiGradientIcon, AiIcon } from "@errows/icons";
import AdvanceImage from "./assets/advance.png";
import { GradientText } from "@/components";

// 背景动画样式
const animationStyle = `
  @keyframes backgroundMove {
    0% {
      background-size: 100%;
      background-position: center center;
    }
    50% {
      background-size: 125%;
      background-position: 60% 40%;
    }
    100% {
      background-size: 100%;
      background-position: center center;
    }
  }
`;
export interface ModelOption {
  id: string;
  name: string;
  version: string;
  tier: string;
  chatType: string;
}

export interface ModelOptionCardProps {
  option: ModelOption;
  isSelected: boolean;
  onClick: () => void;
}

export const ModelOptionCard = ({
  option,
  isSelected,
  onClick,
}: ModelOptionCardProps) => {
  const { name, tier, chatType, id } = option;

  return (
    <>
      {id === "RPMaster" && <style>{animationStyle}</style>}
      <div
        onClick={onClick}
        className={`
        relative h-[77px] px-4 py-[21px] transition-all cursor-pointer flex items-center min-w-[205px] gap-2
        rounded-[16px] max-sm:w-full
        ${
          isSelected
            ? "border border-[#ffffff]"
            : "border border-transparent hover:border-[#ffffff]/50"
        }
      `}
        style={{
          background: id === "RPMaster" ? `url(${AdvanceImage})` : "#090A0A",
          backgroundSize: id === "RPMaster" ? "100%" : "cover",
          backgroundPosition: id === "RPMaster" ? "center center" : "center",
          backgroundRepeat: "no-repeat",
          animation:
            id === "RPMaster"
              ? "backgroundMove 8s ease-in-out infinite"
              : "none",
        }}
      >
        {/* 图标 */}
        {id === "RPMaster" ? (
          <AiGradientIcon className="w-[22px] h-[22px]" />
        ) : (
          <AiIcon className="w-[22px] h-[22px]" />
        )}

        <div className="flex flex-col gap-2">
          {/* 模型名称和等级 */}
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-base">{name}</span>
            {id === "RPMaster" ? (
              <GradientText className="font-urbanist font-bold text-[12px]">
                {chatType}
              </GradientText>
            ) : (
              <span className="text-gray-400 font-urbanist font-light italic text-[10px]">
                {tier}
              </span>
            )}
          </div>

          {/* 聊天类型标签 */}
          <span className="inline-flex items-center px-2 h-4 bg-white/10 rounded-full text-gray-300 text-xs font-urbanist font-normal w-fit">
            {chatType}
          </span>
        </div>
        {/* 选中标记 */}
        {isSelected && (
          <div className="absolute size-[14px] top-2 right-2 bg-[#fff] flex items-center justify-center rounded-full">
            <ModelSelectIcon className="w-2 h-2 text-[#0E0F17]" />
          </div>
        )}
      </div>
    </>
  );
};

interface ModelSelectProps {
  options: ModelOption[];
  value?: string;
  onChange?: (id: string) => void;
}

export const ModelSelect = ({ options, value, onChange }: ModelSelectProps) => {
  return (
    <div className="flex flex-wrap gap-4 max-w-full">
      {options.map((option) => (
        <ModelOptionCard
          key={option.id}
          option={option}
          isSelected={value === option.id}
          onClick={() => onChange?.(option.id)}
        />
      ))}
    </div>
  );
};
