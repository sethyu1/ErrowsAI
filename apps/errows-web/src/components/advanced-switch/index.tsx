import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AiGradientIcon, AiIcon, NSamsaraIcon } from "@errows/icons";

interface AdvancedSwitchProps {
    defaultValue?: string;
    value?: string;
    labels?: [string, string];
    onChange?: (value: string) => void;
}

export function AdvancedSwitch({ labels, defaultValue, value, onChange }: AdvancedSwitchProps) {
    const { t } = useTranslation();
    const defaultLabels: [string, string] = [t('common.basic'), t('common.advanced')];
    const finalLabels = labels || defaultLabels;
    const [selectIdx, setSelectIdx] = useState<number>(0);
    
    // 如果提供了 value，则使用受控模式
    const isControlled = value !== undefined;
    const currentIdx = isControlled ? finalLabels.indexOf(value) : selectIdx;

    useEffect(() => {
        if(!isControlled) {
            if(defaultValue && finalLabels.includes(defaultValue)) {
                setSelectIdx(finalLabels.indexOf(defaultValue));
            } else {
                setSelectIdx(0);
            }
        }
    }, [isControlled, defaultValue, finalLabels])

    const handleClick = () => {
        const newSelectIdx = currentIdx === 0 ? 1 : 0;
        onChange?.(finalLabels[newSelectIdx]);
        if(!isControlled) {
            setSelectIdx(newSelectIdx);
        }
    }

    return (    
        <div
            className="max-w-37.5 w-full inline-flex items-center gap-2 px-4 h-9 rounded-full  cursor-pointer hover:bg-[#35363F] transition-colors"
            style={
                {
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                }
            }
            onClick={handleClick}
        >
            <div className={`text-2xl ${finalLabels[currentIdx] === t('common.advanced') ? 'text-[#A4ACB9]' : 'text-white'}`}>
                {finalLabels[currentIdx] !== t('common.advanced') ? <AiGradientIcon /> : <AiIcon  />}
            </div>
            <span
                className="font-urbanist text-sm font-[700] text-white leading-6"
            >
                {finalLabels[currentIdx === 0 ? 1 : 0]}
            </span>

            <div className={`text-xl`}>
                <NSamsaraIcon />
            </div>
        </div>
    );
}