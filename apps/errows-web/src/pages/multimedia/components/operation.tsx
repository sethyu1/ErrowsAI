import { useTranslation } from 'react-i18next';
import { Button } from '@errows/design'
import { useMobile } from '@/hooks/use-mobile-detector';
import { cn } from '@errows/design/lib/utils';

interface OperationProps {
    count: number;
    onCancel?: () => void;
    onGenerate?: () => void;
}

export function Operation(props: OperationProps) {
    const { t } = useTranslation();
    const { onCancel, onGenerate, count } = props;
    const isMobile = useMobile();

    return (
        <div className={cn('flex items-center justify-center gap-2',
            isMobile ? 'fixed left-0 right-0 bottom-4 mx-auto w-full' : 'absolute right-32 top-24'
        )}>
            <Button
                shape="round"
                className={'px-6 py-2 text-sm font-medium text-white bg-[#22232A] w-36 font-urbanist'}
                onClick={onCancel}
            >
                {t('common.cancel')}
            </Button>
            <Button
                appearance="gradientFill"
                className={'px-6 py-2 text-sm font-medium w-36 text-white font-urbanist'}
                onClick={onGenerate}
            >
                {t('multimedia.generateCount', { count })}
            </Button>
        </div>
    )
}