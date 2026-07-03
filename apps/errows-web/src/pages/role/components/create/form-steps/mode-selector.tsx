import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import rocketImage from '@/assets/images/rocket.webp';
import magicWandImage from '@/assets/images/magic-wand.webp';
import { cn } from '@errows/design/lib/utils';

export interface ModeSelectorProps {
    /** 是否移动端 */
    isMobile?: boolean
    /** 当前选中值 */
    value?: string;
    /** 选择变化回调 */
    onChange?: (value: string) => void;
}

/**
 * 模式选择器
 */
export function ModeSelector({ value, onChange, isMobile = false }: ModeSelectorProps) {
    const { t } = useTranslation();
    
    const options = useMemo(() => [
        {
            label: t('createCharacter.fastEasy'),
            value: 'fast',
            image: rocketImage,
        },
        {
            label: t('createCharacter.customPrompts'),
            value: 'custom',
            image: magicWandImage
        }
    ], [t]);
    
    return (
        <div className="flex flex-nowrap sm:flex-row gap-2 justify-center items-center">
            {options.map((option) => {
                const optionValue = option.value as API.Common.Gender;
                const isSelected = value === optionValue;

                return (
                    <div
                        key={option.value}
                        onClick={() => onChange?.(option.value)}
                        className={cn(
                            'relative cursor-pointer transition-all duration-200',
                            'flex  flex-col gap-y-1  items-center justify-center',
                            'rounded-[8px]',
                            isSelected
                                ? 'border-2 border-white'
                                : 'border border-[#2C2C38] hover:border-[#3A3A48]',
                            isSelected
                                ? 'scale-[1.02]'
                                : 'hover:scale-[1.01] active:scale-[0.99]',
                            'bg-[#2C2C38]',
                            !isMobile ? 'w-[240px] h-[80px]' : 'w-[178px] h-[60px]',
                        )}
                    >
                        <img
                            src={option.image}
                            alt={t('createCharacter.magicWand')}
                            className={cn("object-contain",
                                isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'
                            )}
                        />
                        <span className="text-white text-center flex-1 font-urbanist font-medium text-[15.31px] leading-[21.05px]">
                            {option.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

