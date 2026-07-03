import React from 'react';
import { useTranslation } from 'react-i18next';
import { Separator } from '@errows/design/components/separator';
import { useGlobalServer } from '@/hooks/use-global-server';
import { NavBar } from '@/components/nav-bar';
import { useAccount } from '@/services/auth';
import { useMemberInfo } from '@/services/member';
import { useMobile } from '@/hooks/use-mobile-detector';
import { Plan, Coins, DeleteAccount, Profile, Change } from './components';

function Account() {
  const [showItem, setShowItem] = React.useState('');
  const { t } = useTranslation();
  const [showChange, setShowChange] = React.useState(false);
  const { refetch } = useMemberInfo();
  const { refetch: accountRefetch } = useAccount();

  React.useEffect(
    () => {
      refetch();
      accountRefetch();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const isMobile = useMobile();
  const { setOpenChangePassword } = useGlobalServer();

  const onChangePassword = () => {
    setOpenChangePassword(true);
  }

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-[#0E0F17] z-1000 overflow-auto">
        <NavBar title={t('auth.account')} />
        <div className="pt-21 px-5 pb-7">
          <Profile
            onEdit={(type) => {
              setShowItem(type!);
              setShowChange(true)
            }}
            onChangePassword={onChangePassword}
          />
          <Separator />

          <Plan />
          <Separator />

          <Coins />
          <Separator />

          <DeleteAccount />
        </div>

        <Change
          open={showChange}
          showItem={showItem}
          onClose={() => setShowChange(false)}
          onOpenChange={setShowChange}
        />
      </div>
    )
  }

  return (
    <div className="pt-20 min-h-screen w-full overflow-auto">
      <div className="mx-auto w-full max-w-[1440px] px-6">
        <Profile
          onEdit={() => setShowChange(true)}
          onChangePassword={onChangePassword}
        />
        <Separator />

        <Plan />
        <Separator />

        <Coins />
        <Separator />

        <DeleteAccount />
      </div>

      <Change
        open={showChange}
        onClose={() => setShowChange(false)}
        onOpenChange={setShowChange}
      />
    </div>
  )
}

export default Account;
