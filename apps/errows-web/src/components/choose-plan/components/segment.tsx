import type { DateType } from '@/types';
import { useTranslation } from 'react-i18next'
import { cn } from '@errows/design/lib/utils';
import { cva } from 'class-variance-authority';

const variants = cva(
  'w-25 h-9 text-sm leading-9 font-bold text-center over rounded-full cursor-pointer',
  {
    variants: {
      active: {
        false: null,
        true: ['bg-errows-gradient-primary'],
      }
    },
    defaultVariants: {
      active: false,
    },
  }
)

interface SegmentProps {
  value: DateType;
  onChange?: (value: DateType) => void;
}

const options: { value: DateType; label: string }[] = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
]

export function Segment(props: SegmentProps) {
  const { value = 'monthly', onChange } = props;
  const { t } = useTranslation();

  const options: { value: DateType; label: string }[] = [
    { value: 'yearly', label: t(`common.yearly`) },
    { value: 'monthly', label: t(`common.monthly`) },
  ]

  return (
    <div
      className="relative flex w-50 rounded-full bg-[#22232A]"
      style={{
        border: '1px solid rgba(255,255,255,0.4)',
      }}
    >
      {options.map((option) => {
        return (
          <div
            key={option.value}
            className={cn(variants({
              active: option.value === value
            }))}
            onClick={() => onChange?.(option.value)}
          >
            {option.label}
          </div>
        )
      })}
    </div>
  )
}

