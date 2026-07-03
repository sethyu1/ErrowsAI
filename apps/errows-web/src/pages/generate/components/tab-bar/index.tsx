import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@errows/design/lib/utils";
import { useMobile } from "@/hooks/use-mobile-detector";
import { TEXT_GRADUAL_STYLE } from "@/config";

interface TabOption {
  label: string;
  value: string;
}

interface TabBarProps {
  defaultValue?: string;
  options?: TabOption[];
  highMode?: boolean;
  onChange?: (value: string) => void;
  onSuggestionsClick?: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  defaultValue,
  options = [],
  highMode = false,
  onChange,
  onSuggestionsClick,
}) => {
  const { t } = useTranslation();
  const isMobile = useMobile();
  const initialValue = useMemo(() => {
    if (defaultValue) {
      return defaultValue;
    }
    return options[0]?.value || "";
  }, [defaultValue, options]);

  const [selectedValue, setSelectedValue] = useState(initialValue);

  const handleChange = (value: string) => {
    setSelectedValue(value);
    onChange?.(value);
  };

  return (
    <div
      className={cn(
        "flex",
        isMobile ? "flex-col items-center" : "flex-row items-center"
      )}
    >
      {highMode && (
        <div
          onClick={onSuggestionsClick}
          className={cn(
            "text-sm text-white font-urbanist font-[700] mr-6 cursor-pointer hover:opacity-80 transition-opacity",
            isMobile ? "mb-0" : "mb-2"
          )}
        >
          {t('common.suggestions')}
        </div>
      )}
      <div
        className={cn(
          "relative flex flex-1 w-full items-center justify-between gap-2 overflow-x-auto scrollbar-hide",
          isMobile ? "text-xs" : "text-sm"
        )}
      >
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <div
              key={option.value}
              onClick={() => handleChange(option.value)}
              className={cn(
                "flex flex-col items-center justify-center shrink py-2 font-urbanist text-white font-[700] text-sm transition-all duration-200 cursor-pointer first:pl-0 last:pr-0",
                isMobile ? "px-3" : "px-4"
              )}
              style={{
                ...(isSelected ? TEXT_GRADUAL_STYLE : {}),
              }}
            >
              {option.label}

              <div
                style={{
                  zIndex: 1,
                  background: isSelected
                    ? "linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)"
                    : "transparent",
                  height: 2,
                  ...(isMobile
                    ? {
                        marginTop: 8,
                        width: 22,
                        borderRadius: 20,
                      }
                    : {
                        marginTop: 4,
                        width: 20,
                      }),
                }}
              ></div>
            </div>
          );
        })}

        {isMobile && (
          <div
            className="absolute left-0 right-0 bottom-0 with-full bg-[#23232E]"
            style={{
              height: 4,
              bottom: 8,
              borderRadius: 20,
            }}
          />
        )}
      </div>
    </div>
  );
};
