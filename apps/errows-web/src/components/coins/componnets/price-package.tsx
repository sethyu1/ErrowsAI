import { useTranslation } from 'react-i18next';
import { Spinner } from '@errows/design/components/spinner';
import gold from '@/assets/images/gold.webp';
import { Button } from '@errows/design/components/button';

interface PricePackageProps {
  loading?: boolean;
  disabled?: boolean;
  data: API.Payment.CoinProductInfo;
  onClick?: (info: API.Payment.CoinProductInfo) => void;
}

export function PricePackage(props: PricePackageProps) {
  const { loading = false, disabled = false, data, onClick } = props;
  const { t } = useTranslation();

  return (
    <div className="relative w-full h-[110px] rounded-lg p-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
      <div className="w-full h-full px-6 py-5 rounded-lg bg-[rgba(27,18,39,1)] flex items-center justify-between">
        {/* Left section - Coins */}
        <div className="flex items-center gap-2">
          <img src={gold} alt="gold" className="size-8" />
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-white leading-none">
              {data?.amount || 0}
            </span>
            <span className="text-xs text-gray-300 text-right">
              {t('sidebar.coins')}
            </span>
          </div>
        </div>

        {/* Center section - Original price */}
        <div className="flex flex-col items-center">
          <span className="text-base font-semibold text-gray-400 line-through">
            ${data?.before_discount_price || 0}
          </span>
        </div>

        {/* Right section - Current price and button */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <span className="text-2xl font-bold text-white">
              ${data?.price || 0}
            </span>
            <span className="text-sm text-[rgba(193,199,208,1)] ml-2">/ {t('auth.each')}</span>
          </div>
          <Button
            appearance="gradientFill"
            shape="round"
            className="w-32"
            disabled={loading || disabled}
            onClick={() =>  onClick?.(data)}
          >
            {loading && <Spinner />}
            {t('auth.buyNow')}
          </Button>
        </div>
      </div>
    </div>
  )
}
