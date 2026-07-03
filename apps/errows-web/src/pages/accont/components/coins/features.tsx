import { cn } from '@errows/design/lib/utils';
import { useTranslation } from 'react-i18next';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface FeaturesProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Features(props: FeaturesProps) {
  const { className, ...rest } = props;
  const { t } = useTranslation();

  return (
    <div className={cn('text-[#A4ACB9]', className)} {...rest}>
      <div>{t('auth.coinsDesc1')}</div>
      <div>{t('auth.coinsDesc2')}</div>
      <div>{t('auth.coinsDesc3', { number: 7 })}</div>
      <div>{t('auth.coinsDesc4', { number: 1 })}</div>
    </div>
  )
}
