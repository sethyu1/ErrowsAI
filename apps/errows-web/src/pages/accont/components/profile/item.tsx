import { Button } from '@errows/design/components/button';
import { useTranslation } from 'react-i18next';

interface ItemProps {
  title: string;
  value?: string;
  showEdit?: boolean;
  onEdit?: () => void;
}

export function Item(props: ItemProps) {
  const { title, value, showEdit, onEdit } = props;
  const { t } = useTranslation();

  return (
    <div className="flex gap-6">
      <div>
        <div className="text-sm leading-7 text-[#A4ACB9]">
          {title}
        </div>
        <div className="text-2xl leading-7 text-white">
          {value}
        </div>
      </div>
      {showEdit && (
        <div className="flex self-end pb-1">
          <Button className="w-13 cursor-pointer" size="mini" shape="round" onClick={onEdit}>
            {t('common.edit')}
          </Button>
        </div>
      )}
    </div>
  )
}
