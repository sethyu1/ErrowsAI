import { useTranslation } from 'react-i18next';
import { cn } from '@errows/design/lib/utils';
import { useShallow } from 'zustand/react/shallow';
import gold from '@/assets/images/gold.webp';
import silver from '@/assets/images/silver.webp';
import { useMemberStore } from '@/stores/member';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AvailableProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Available(props: AvailableProps) {
  const { className, ...rest } = props;
  const { t } = useTranslation();
  const { info } = useMemberStore(useShallow(state => ({
    info: state.info,
  })));

  return (
    <div className={cn('flex', className)} {...rest}>
      <span className="text-[#FBC959]">{t(`auth.availableCoins`)}：</span>
      <div className="flex items-center gap-2">
        <img src={gold} className="size-3.5" />
        <span>{info?.coin_purchased_balance || 0}</span>
      </div>
      <div className="flex items-center ml-14 gap-2">
        <img src={silver} className="size-3.5" />
        <span>{info?.coin_free_balance || 0}</span>
      </div>
    </div>
  )
}
