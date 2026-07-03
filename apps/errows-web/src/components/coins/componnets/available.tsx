import { useMobile } from '@/hooks/use-mobile-detector';
import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';
import silver from '@/assets/images/silver.webp';
import gold from '@/assets/images/gold.webp';

interface AvailableProps {
  className?: string;
  data: {
    gold: number;
    silver: number;
  }
}

export function Available(props: AvailableProps) {
  const { className, data } = props;
  const isMobile = useMobile();
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'flex justify-end items-center gap-3',
        className
      )}
    >
      <span
        className={cn(
          'font-normal text-base leading-5.5',
          isMobile ? 'text-[#FCFCFC]' : 'text-[#FBC959]'
        )}
      >
        {t('auth.availableCoins')}:
      </span>

      <div className="flex gap-4.5">
        <div className="flex items-center gap-2">
          <img src={gold} alt="gold" className="size-3.5" />
          <span className="font-bold text-[14px] leading-[22px] text-[#FCFCFC]">
            {data?.gold || 0}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <img src={silver} alt="silver" className="size-3.5" />
          <span className="font-bold text-[14px] leading-[22px] text-[#FCFCFC]">
            {data?.silver || 0}
          </span>
        </div>
      </div>
    </div>
  )
}


