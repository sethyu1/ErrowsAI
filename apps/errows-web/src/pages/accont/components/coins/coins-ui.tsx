import { useTranslation } from 'react-i18next';
import { cva } from 'class-variance-authority';
import { cn } from '@errows/design/lib/utils';
import gold from '@/assets/images/gold.webp';

interface CoinsUIProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'small' | 'default';
}

const variants = cva(
  '',
  {
    variants: {
      size: {
        default: 'size-16 h-auto',
        small: 'size-16 h-auto',
      }
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export function CoinsUI(props: CoinsUIProps) {
  const { className, size, ...rest } = props;
  const { t } = useTranslation();

  return (
    <div className={cn(variants({ size }), className)} {...rest}>
      <img src={gold} className="w-full" />
      <div className="text-center">
        {t('sidebar.coins')}
      </div>
    </div>
  )
}
