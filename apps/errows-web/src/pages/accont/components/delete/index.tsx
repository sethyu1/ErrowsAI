import { useTranslation } from 'react-i18next';
import { Button } from '@errows/design/components/button';
import { useMobile } from '@/hooks/use-mobile-detector';
import { Spinner } from '@errows/design/components/spinner';
import { useDeleteAccount } from '@/services/auth';
import { Confirm } from './confirm';

export function DeleteAccount() {
  const isMobile = useMobile();
  const { t } = useTranslation();
  const { deleteAccount, loading } = useDeleteAccount();

  const onDeleteAccount =  () => {
    deleteAccount();
  };

  if (isMobile) {
    return (
      <div className="mt-4.5">
        <div className="font-bold text-[#4A4E58]">
          {t('auth.deleteAccount')}
        </div>

        <div className="mt-4.5 text-[#A4ACB9]">
          {t('auth.deleteAccountDesc')}
        </div>

        <div className="mt-4.5 flex justify-center">
          <Confirm onConfirm={onDeleteAccount}>
            <Button
              className="w-31.5 text-[#A4ACB9]"
              variant="outline"
              shape="round"
              disabled={loading}
            >
              {loading && <Spinner />}
              {t(`auth.deleteAccount`)}
            </Button>
          </Confirm>
        </div>
      </div>
    )
  }

  return (
    <div className="pl-11 pt-6 pr-15 pb-9.5">
      <div className="flex flex-col">
        <div className="flex text-base font-bold leading-5.5">
          <div className="w-23" />
          <div className="ml-12 text-[#4A4E58]">
            {t(`auth.deleteAccount`)}
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <div className="flex">
            <div className="w-23" />
            <div className="ml-12 max-w-105 text-[#A4ACB9]">
              {t('auth.deleteAccountDesc')}
            </div>
          </div>

          <Confirm onConfirm={onDeleteAccount}>
            <Button
              className="text-[#A4ACB9]"
              variant="outline"
              shape="round"
              disabled={loading}
            >
              {loading && <Spinner />}
              {t(`auth.deleteAccount`)}
            </Button>
          </Confirm>
        </div>
      </div>
    </div>
  )
}
