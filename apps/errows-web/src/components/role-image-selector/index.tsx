import { RoleImageCard } from '../role-image-card';
import { useTranslation  } from 'react-i18next';

export interface RoleImageSelectorProps {
  /** 是否移动端 */
  isMobile?: boolean
  /** 当前选中的z值*/
  value?: string;
  /** 选项列表 */
  options: { value: string; label: string, url: string }[];
  size?: 'large' | 'small';
  /** 选择变化回调 */
  onChange?: (value: string) => void;
}

export function RoleImageSelector({ value, onChange, options =[], size = 'small' , isMobile =false}: RoleImageSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="w-full mx-auto px-2">
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {options.map((option: { value: string; label: string, url: string }) => (
          <RoleImageCard
            key={option.value}
            imageUrl={option.url}
            name={t(`characterOptions.labels.${option.label}`)}
            selected={value === option.value}
            onClick={() => onChange?.(option.value)}
            size={size}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
}
