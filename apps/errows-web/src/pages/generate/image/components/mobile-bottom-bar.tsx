import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@errows/design";
import { ArrowRightIcon } from "@errows/icons";
import { SummarySection } from "./summary-section";

interface MobileBottomBarProps {
  setting: Record<string, string[]>;
  configs: API.Character.ImageGenerationOptions[];
  hasGeneratingTask: boolean;
  highMode?: boolean;
  roleId?: string;
  isLoading: boolean;
  isPending: boolean;
  onGenerate: () => void;
  onRoleSelectOpen?: () => void;
  onGeneratingIconClick?: () => void;
  onImageClick?: (typeKey: string, itemValue: string) => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  setting,
  configs,
  hasGeneratingTask,
  highMode = false,
  roleId,
  isLoading,
  isPending,
  onGenerate,
  onRoleSelectOpen,
  onGeneratingIconClick,
  onImageClick,
}) => {
  const { t } = useTranslation();
  const handleButtonClick = () => {
    if (!roleId && onRoleSelectOpen) {
      onRoleSelectOpen();
    } else {
      onGenerate();
    }
  };
  return (
    <div
      className="z-999 fixed left-0 right-0 bottom-0"
      style={{
        background:
          "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 86.54%)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Summary Section - 高级模式下不显示 */}
      {!highMode && (
        <div
          className="px-3 pt-2"
          style={{
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          <SummarySection
            setting={setting}
            configs={configs}
            isMobile={true}
            hasGeneratingTask={hasGeneratingTask}
            highMode={highMode}
            onGeneratingIconClick={onGeneratingIconClick}
            onImageClick={onImageClick}
          />
        </div>
      )}

      {/* Generate Button */}
      <div
        className="flex justify-center items-center"
        style={{
          minHeight: 60,
          marginBottom: '20px',
        }}
      >
        <Button
          appearance="gradientFill"
          className="text-white font-urbanist font-medium text-base"
          onClick={handleButtonClick}
          disabled={isLoading || isPending}
          loading={isPending}
          size="sm"
          shape="round"
          style={{
            padding: "8px 26px",
            width: 240,
            margin: "0 auto",
          }}
        >
          {t('generate.generateBtn')} <ArrowRightIcon />
        </Button>
      </div>
    </div>
  );
};

