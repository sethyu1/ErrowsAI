import { useTranslation } from 'react-i18next';
import bg from '@/assets/images/background/coins.webp';
import { Coins } from '@/components/coins';
import { useMobile } from '@/hooks/use-mobile-detector';

function CoinsPage() {
  const { t } = useTranslation();
  const isMobile = useMobile();

  return (
    <div
      className="relative w-full h-full pt-20"
      style={isMobile ? {} : {
        backgroundImage: `url(${bg})`,
        backgroundSize: '536px 784px',
        backgroundPosition: 'top 122px right 0px',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="text-center font-bold text-3xl text-white">
        {t('sidebar.coins')}
      </div>
      <div className="flex w-full mt-8 justify-center">
        <div className="w-108">
          <Coins showAvailable={false} isPage />
        </div>
      </div>
    </div>
  )
}

export default CoinsPage;
