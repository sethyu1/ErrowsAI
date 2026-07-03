import ImageEmpty from '@/assets/empty-box.webp';
import { useTranslation } from 'react-i18next';

export function ListEmpty({ title, }: { title?: string, image?: string }) {
    const { t } = useTranslation();
    const defaultTitle = title ?? t('multimedia.noData');
    return (
        <div className="flex flex-col items-center">
            <img src={ImageEmpty} alt="empty" className="block" style={{
              width: 160,
              height: 126
            }} />
            <p className="text-gray-400 text-center font-urbanist text-lg mt-2">
              {defaultTitle}
            </p>
        </div>
    );
}