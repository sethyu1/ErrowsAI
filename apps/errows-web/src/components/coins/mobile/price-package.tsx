import { useTranslation } from 'react-i18next';
import { Spinner } from '@errows/design/components/spinner';
import gold from '@/assets/images/gold.webp';
import { Button } from '@errows/design/components/button';
import { gradientConfig } from '../../member';

interface PricePackageProps {
  loading?: boolean;
  disabled?: boolean;
  data: API.Payment.CoinProductInfo;
  onClick?: (info: API.Payment.CoinProductInfo) => void;
}

export function PricePackage(props: PricePackageProps) {
  const { loading = false, disabled = false, data, onClick } = props;
  const { t } = useTranslation();

  const borderStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(#22232A, #22232A), ${gradientConfig.galaxy}`,
    backgroundOrigin: 'padding-box, border-box',
    backgroundClip: 'padding-box, border-box',
    border: '2px solid transparent',
  };

  return (
    <div
      className="flex justify-between items-center w-full h-23 px-3 rounded-lg p-0.5"
      style={borderStyle}
    >
      <div className="flex items-center gap-1.5">
        <img className="w-6 h-6" src={gold} alt="gold" />
        <span className="font-bold text-2xl">{data?.amount || 0}</span>
      </div>
      <div className="flex flex-col items-end gap-3">
        <div>
          <span className="font-bold line-through text-xs text-[#A4ACB9]">
            ${data?.before_discount_price || 0}
          </span>
          <span className="ml-2 font-bold text-2xl">
            ${data?.price || 0}
          </span>
        </div>
        <div>
          <Button
            className="w-22 h-7 text-xs"
            appearance="gradientFill"
            shape="round"
            disabled={loading || disabled}
            onClick={() => { onClick?.(data); }}
          >
            {loading && <Spinner />}
            {t('auth.buyNow')}
          </Button>
        </div>
      </div>
    </div>
  )
}
