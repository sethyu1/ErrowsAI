import { useTranslation } from 'react-i18next';
import { CloseIcon, ArrowLeftIcon } from '@errows/icons';

export function CreateHeader() {
  const { t } = useTranslation();
  return (
    <div className="w-full flex items-center justify-center py-3">
      <div className="w-[24px] h-[24px] flex items-center justify-center">
        <ArrowLeftIcon className="w-[13px] h-[13px] text-white" />
      </div>
      <div
        className="mx-[196px] text-white font-bold text-[22px] leading-[28px] text-center"
        style={{ fontFamily: 'Urbanist, sans-serif' }}
      >
        {t('createCharacter.createMyAICharacter')}
      </div>
      <div className="w-[24px] h-[24px] flex items-center justify-center">
        <CloseIcon className="w-[13px] h-[13px] text-white" />
      </div>
    </div>
  );
}
