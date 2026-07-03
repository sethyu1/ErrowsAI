import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';

interface FeaturesProps extends React.HTMLAttributes<HTMLDivElement> {
  list: string[];
}

export function Features(props: FeaturesProps) {
  const { className, list = [], ...rest } = props;
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-col gap-3 text-[#A4ACB9]', className)} {...rest}>
      <div className="text-base font-bold leading-5.5 text-[#FCFCFC]">
        {t('auth.features')}:
      </div>

      <div className="flex flex-col gap-3">
        {list.map((item, index) => (
          <div key={index} className="flex gap-3 items-center text-[#DBDBE6]">
            <div className="size-1.5 rounded-full bg-[#A4ACB9] shrink-0" />
            <div className="text-base leading-6">
              {item}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
