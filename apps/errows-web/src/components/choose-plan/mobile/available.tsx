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
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'flex justify-end items-center gap-3',
        className
      )}
    >
      <span className="font-normal text-lg leading-7 text-[#D7DADA]">
        {t(`auth.availableCoins`)}:
      </span>

      <div className="flex gap-2.5">
        <div className="flex items-center gap-1">
          <img src={gold} alt="gold" className="size-3.5" />
          <span className="font-bold text-sm leading-7 text-[#FCFCFC]">
            {data?.gold || 0}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <img src={silver} alt="silver" className="size-3.5" />
          <span className="font-bold text-sm leading-7 text-[#FCFCFC]">
            {data?.silver || 0}
          </span>
        </div>
      </div>
    </div>
  )
}
