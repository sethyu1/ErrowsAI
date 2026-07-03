import React from 'react';
import { ArrowRightIcon, EditIcon } from '@errows/icons';
import { useTranslation } from 'react-i18next';
import { Button } from '@errows/design/components/button';
import { Item } from './item';
import { useGlobalStore } from '@/stores/global';
import { useGlobalServer } from '@/hooks/use-global-server';
import { useAuthStore } from '@/stores/auth';
import { getGenderEnum } from '@/config';
import { useShallow } from 'zustand/react/shallow';
import { useMobile } from '@/hooks/use-mobile-detector';
import { UploadAvatar } from '../upload-avatar';
import { UploadAvatarMobile } from '../upload-avatar/mobile';
import { Avatar } from './avatar';
import { Input } from './input';
import { useCharacterImages } from '@/services/character';

interface ProfileProps {
  onEdit?: (type?: string) => void;
  onChangePassword?: () => void;
}

export function Profile(props: ProfileProps) {
  const { onEdit, onChangePassword } = props;
  const { t } = useTranslation();
  const [openUpload, setOpenUpload] = React.useState(false);
  const { locale } = useGlobalStore(useShallow(state => ({
    locale: state.locale,
  })));

  const isMobile = useMobile();
  const { setOpenLogout } = useGlobalServer();
  const { user } = useAuthStore(useShallow(state => ({
    user: state.user,
  })));
  const { data: characterData = [] } = useCharacterImages({ page: 0, size: 1 });
  const hasCharacters = characterData.length > 0;

  const genderText = React.useMemo(
    () => {
      const GenderEnum = getGenderEnum();
      return GenderEnum.label(user?.profile?.gender || GenderEnum.UNKNOWN);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, user]
  )

  const onLogout = () => {
    setOpenLogout(true);
  }

  const openUploadAvatar = () => {
    if (!hasCharacters) {
      return;
    }
    setOpenUpload(true);
  }

  if (isMobile) {
    return (
      <div className="pb-6">
        <div className="flex justify-center">
          <Avatar
            onClick={openUploadAvatar}
            edit={hasCharacters}
            src={user?.profile?.avatar}
          />
        </div>

        <div className="mt-3">
          <Input label={t('auth.nickname')} onEdit={() => onEdit?.('name')}>
            {user?.name || '-'}
          </Input>

          <Input label={t('auth.password')} onEdit={onChangePassword}>
            ********
          </Input>
        </div>

        <div className="flex justify-between mt-5 text-[#A4ACB9]">
          <div className="flex gap-9">
            <div>
              <div className="text-sm leading-7">
                {t('auth.email')}
              </div>
              <div className="text-sm font-bold text-white">
                {user?.email || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm leading-7">
                {t('auth.gender')}
              </div>
              <div className="text-sm font-bold text-white">
                {genderText}
              </div>
            </div>
          </div>

          <div className="flex items-center mr-4">
            <EditIcon onClick={() => onEdit?.('gender')} className="size-5 text-white" />
          </div>
        </div>

        <UploadAvatarMobile open={openUpload} onOpenChange={setOpenUpload} />
      </div>
    )
  }

  return (
    <div className="pl-11 pt-6 pr-15 pb-9.5">
      <div className="flex flex-col">
        <div className="flex justify-between mt-6">
          <div className="flex">
            <div className="w-23">
              <Avatar
                onClick={openUploadAvatar}
                edit={hasCharacters}
                src={user?.profile?.avatar}
              />
            </div>
            <div className="ml-12 text-[#A4ACB9]">
              <div className="flex flex-col gap-7">
                <Item
                  title={t('auth.nickname')}
                  value={user?.name || '-'}
                  showEdit
                  onEdit={onEdit}
                />
                <Item title={t('auth.email')} value={user?.email || '-'} />
              </div>
            </div>
            <div className="ml-23 text-[#A4ACB9]">
              <div className="flex flex-col gap-7">
                <Item
                  title={t('auth.gender')}
                  value={genderText}
                  showEdit
                  onEdit={onEdit}
                />
                <Item title={t('auth.password')} value="*********" showEdit onEdit={onChangePassword} />
              </div>
            </div>
          </div>

          <Button variant="outline" shape="round" onClick={onLogout}>
            {t('auth.logout')}
            <ArrowRightIcon />
          </Button>
        </div>
      </div>

      <UploadAvatar open={openUpload} onOpenChange={setOpenUpload} />
    </div>
  )
}
