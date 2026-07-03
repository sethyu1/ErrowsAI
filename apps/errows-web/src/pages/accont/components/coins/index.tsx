import { ArrowRightIcon } from '@errows/icons';
import { useTranslation } from 'react-i18next';
import { Button } from '@errows/design/components/button';
import { useMobile } from '@/hooks/use-mobile-detector';
import { Available } from './available';
import { useGlobalServer } from '@/hooks/use-global-server';
import { Features } from './features';
import { CoinsUI } from './coins-ui';

export function Coins() {
  const isMobile = useMobile();
  const { t } = useTranslation();
  const { setOpenGetCoins } = useGlobalServer();

  const onOpenGetCoins = () => {
    setOpenGetCoins(true);
  }

  if (isMobile) {
    return (
      <div className="pt-6 pb-7.5">
        <div className="flex justify-between">
          <div>
            <div className="text-[#FCFCFC]">
              {t(`auth.gameCoins`)}
            </div>
            <Available className="mt-2" />
          </div>

          <CoinsUI size="small" />
        </div>

        <Features className="mt-4.5" />

        <div className="mt-7 flex justify-center">
          <Button
            appearance="gradientOutline"
            shape="round"
            className="cursor-pointer"
            onClick={onOpenGetCoins}
          >
            {t('auth.getMoreCoins')}
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="pl-11 pt-6 pr-15 pb-9.5">
      <div className="flex flex-col">
        <div className="flex text-base font-bold leading-5.5">
          <div className="w-23 text-[#FCFCFC]">
            {t(`auth.gameCoins`)}
          </div>

          <Available className="ml-12" />
        </div>
        <div className="flex justify-between mt-6">
          <div className="flex">
            <div className="w-23">
              <CoinsUI />
            </div>

            <Features className="ml-12" />
          </div>

          <Button
            appearance="gradientOutline"
            shape="round"
            className="cursor-pointer"
            onClick={onOpenGetCoins}
          >
            {t('auth.getMoreCoins')}
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
