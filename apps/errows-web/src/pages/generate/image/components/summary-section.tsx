import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@errows/design/lib/utils";
import { RoleImageCard, GeneratingIcon } from "@/components";

interface SummarySectionProps {
  setting: Record<string, string[]>;
  configs: API.Character.ImageGenerationOptions[];
  isMobile: boolean;
  hasGeneratingTask: boolean;
  highMode?: boolean;
  onGeneratingIconClick?: () => void;
  onImageClick?: (typeKey: string, itemValue: string) => void;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  setting,
  configs,
  isMobile,
  hasGeneratingTask,
  highMode = false,
  onGeneratingIconClick,
  onImageClick,
}) => {
  const { t } = useTranslation();
  const hasSummary = !!Object.values(setting).flat().length;

  // 高级模式下不显示 Summary
  if (highMode) return null;

  const renderSummaryCards = () => {
    return Object.entries(setting).flatMap(([typeKey, selectedValues]) => {
      const config = configs?.find(
        (config) => config.title === typeKey
      );
      if (!config) return [];

      return (selectedValues as string[])
        .map((value, idx) => {
          const option = config.options.find(
            (opt: API.Character.ImageGenerationOptions["options"][0]) =>
              opt.value === value
          );
          if (!option) return null;

          return (
            <RoleImageCard
              key={`${typeKey}-${value}-${idx}`}
              imageUrl={option.url}
              name={t(`generateOptions.${option.value}`)}
              onClick={() => onImageClick?.(typeKey, value)}
              size="small"
              isMobile={isMobile}
              noShadow
            />
          );
        })
        .filter(Boolean);
    });
  };

  return (
    <div className={cn("flex flex-col gap-2", isMobile && "px-3")}>
      <div
        className={cn(
          "relative font-[700] text-sm text-white",
          isMobile && "text-center mb-2"
        )}
      >
        {t('generate.summary')}
        {isMobile && hasGeneratingTask && onGeneratingIconClick && (
          <div className="absolute top-0 right-2">
            <GeneratingIcon onClick={onGeneratingIconClick} />
          </div>
        )}
      </div>
        <div
          className={cn(
            "flex flex-wrap gap-2 bg-[#1D1E27] overflow-auto scrollbar-hide",
            'min-h-[136px]',
            !isMobile ? "max-h-[280px]" : "max-h-[280px]"
          )}
          style={{
            padding: 2,
            borderRadius: 8,
          }}
        >
          {hasSummary && renderSummaryCards()}
        </div>
    </div>
  );
};
