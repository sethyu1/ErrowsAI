import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@errows/design";
import { ArrowRightIcon } from "@errows/icons";

interface PcBottomButtonProps {
  roleId?: string;
  isLoading: boolean;
  isPending: boolean;
  generateEnabled: boolean;
  onGenerate: () => void;
  onRoleSelectOpen?: () => void;
}

export const PcBottomButton: React.FC<PcBottomButtonProps> = ({
  roleId,
  isLoading,
  isPending,
  generateEnabled,
  onGenerate,
  onRoleSelectOpen,
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
    <Button
      appearance="gradientFill"
      className="text-white font-urbanist font-medium text-base z-999"
      onClick={handleButtonClick}
      disabled={isLoading || isPending || !generateEnabled}
      loading={isPending}
      size="sm"
      shape="round"
      style={{
        padding: "8px 26px",
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 40,
        width: 240,
        margin: "0 auto",
      }}
    >
      {t('generate.generateBtn')} <ArrowRightIcon />
    </Button>
  );
};

