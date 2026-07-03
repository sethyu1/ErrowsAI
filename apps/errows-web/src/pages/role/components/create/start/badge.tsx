import { useTranslation } from 'react-i18next';
import { AuroraText } from '@errows/design';
import union from '@/assets/images/background/union.svg';
import { cn } from '@errows/design/lib/utils';

interface BadgeProps {
  className?: string;
}

export function Badge(props: BadgeProps) {
  const { t } = useTranslation();
  const { className } = props;

  return (
    <div
      className={cn(
        'relative w-[100px] h-[100px] rounded-full overflow-hidden flex items-center justify-center',
        className
      )}
    >
      <img className="absolute left-0 top-0 h-full w-full" src={union} alt='bg' />
      <div
        className="rounded-full w-[93px] h-[93px] flex flex-col items-center justify-center"
        style={{
          background: 'rgba(27, 18, 39, 1)',
          border: '5px solid transparent',
          zIndex: 5,
        }}
      >
        <AuroraText className="text-[12px]">
          {t('createCharacter.badgeSteps')}
        </AuroraText>
        <div className="text-[12px] text-[#C9C9C9]">{t('createCharacter.badgeRoadmap')}</div>
      </div>
    </div>
  );
}
