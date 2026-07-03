import React from "react";
import { cn } from "@errows/design/lib/utils";
import { RoleImageCard } from "@/components";
import { useTranslation } from "react-i18next";
interface ImageListProps {
  imageList: API.Character.ImageGenerationOptions["options"];
  activeType: string;
  setting: Record<string, string[]>;
  isMobile: boolean;
  highMode?: boolean;
  onImageClick: (itemValue: string) => void;
}

export const ImageList: React.FC<ImageListProps> = ({
  imageList,
  activeType,
  setting,
  isMobile,
  highMode = false,
  onImageClick,
}) => {
  const { t } = useTranslation();
  const currentSelected = setting[activeType] || [];

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 overflow-y-auto scrollbar-hide",
        !isMobile ? "max-h-[280px]" : "justify-center"
      )}
      style={
        isMobile
          ? {
              maxHeight: highMode ? "calc(100vh - 400px)" : "calc(100vh - 420px)", // 避让底部固定区域（Summary + Generate按钮 + 其他UI元素）
              paddingBottom: "20px",
            }
          : {}
      }
    >
      {imageList.map((item: API.Character.ImageGenerationOptions["options"][0], idx: number) => {
        const isSelected = currentSelected.includes(item.value);

        return (
          <RoleImageCard
            key={idx}
            imageUrl={item.url}
            name={t(`generateOptions.${item.value}`)}
            selected={isSelected}
            onClick={() => onImageClick(item.value)}
            size="small"
            isMobile={isMobile}
            noShadow
          />
        );
      })}
    </div>
  );
};

