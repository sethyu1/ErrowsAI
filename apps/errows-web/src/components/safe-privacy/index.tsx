import { EyeInvisibleIcon, SafetyCertificateIcon } from '@errows/icons';
import { useTranslation } from 'react-i18next';
import { Separator } from '@errows/design/components/separator'
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@errows/design/lib/utils';

const variants = cva(
  'flex flex-nowrap shrink-0 text-[#A4ACB9]',
  {
    variants: {
      size: {
        default: 'text-sm gap-2',
        mini: 'text-xs max-[380px]:text-[10px] gap-1 max-[380px]:gap-1',
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface SafePrivacyProps extends React.ComponentProps<'div'>, VariantProps<typeof variants> {
  iconVariant?: 'green' | 'white';
}

export function SafePrivacy(props: SafePrivacyProps) {
  const { size, className, iconVariant = 'green' } = props;
  const { t } = useTranslation();
  const iconClassName = iconVariant === 'white' ? 'size-3 text-white' : 'size-3 text-[rgba(92,184,92,1)]';

  return (
    <div className={cn(variants({ size, className }))}>
      <div className={cn('flex items-center shrink-0', size === 'mini' ? 'gap-1.5' : 'gap-2')}>
        <SafetyCertificateIcon className={cn(iconClassName, 'shrink-0')} />
        <span className="whitespace-nowrap">{t('auth.securePayments')}</span>
      </div>
      <Separator orientation="vertical" className="shrink-0 bg-[#4A4E58]" />
      <div className={cn('flex items-center shrink-0', size === 'mini' ? 'gap-1.5' : 'gap-2')}>
        <EyeInvisibleIcon className={cn(iconClassName, 'shrink-0')} />
        <span className="whitespace-nowrap">{t('auth.privacyInBankTransaction')}</span>
      </div>
    </div>
  );
};
