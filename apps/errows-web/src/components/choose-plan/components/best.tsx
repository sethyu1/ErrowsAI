import { cva, type VariantProps } from 'class-variance-authority';
import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';
import { ShineBorder } from '@errows/design/components/shine-border';

const variants = cva(
  'relative text-xs font-bold rounded-full text-center',
  {
    variants: {
      size: {
        default: 'px-4 py-2',
        sm: 'px-2.5 py-1.25',
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export function Best(props: VariantProps<typeof variants>) {
  const { size } = props;
  const { t } = useTranslation();

  return (
    <div className={cn(variants({ size }))}>
      <ShineBorder shineColor={['rgba(221,66,157,1)', 'rgba(177,75,244,1)', 'rgba(72,92,251,1)']} />
      {t('auth.bestSeller')}
    </div>
  )
}
