import { useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CardItem, EmptyCardItem } from './card-item';
import { RoleLoadingCard } from '@/components';
import { MediaViewer, type MediaViewerRef } from '@/components/media-viewer';
import { download } from '../util';
import { FOOTER_OPERATIONS } from '../constants';
import { useMobile } from '@/hooks/use-mobile-detector';
import type { RoleMedia } from '../type';
import type { MediaItem } from '@/components/media-viewer';
import { CreateEntryCard } from './create-entry';
interface CardListProps {
  /** 列表 */
  list: RoleMedia[];
  /** 正在生成中的ID列表 */
  loadingIds?: string[];
  /** 标签 */
  type: 'image' | 'video';
  /** 批量模式 */
  batchMode: boolean;
  isGroup?: boolean;
  selectedList: string[];
  hoverEnabled?: boolean;
  /**是否展示统计 */
  statisticsMode?: boolean;
  /** style */
  style?: React.CSSProperties;
  handleItemClick: (id: string) => void;
  onGenerateVideo?: (id: string) => void;
  createEntryCard?: boolean;
  showDeleteEntry?: boolean;
  onDelete?: (id: string) => void;
}

// 移动端卡片宽度：保证一行2个卡片 (屏幕宽度 - 左右padding 24px - gap 8px) / 2，最大179px
const getMobileCardWidth = () => Math.min(179, Math.floor((window.innerWidth - 32) / 2));

const cardStyle = {
  large: {
      width: 184,
      height: 284,
  },
  small: {
      width: getMobileCardWidth(),
      height: 276,
  }
}

export function CardList(props: CardListProps) {
  const { t } = useTranslation();
  const { list, type, batchMode, isGroup = true, selectedList, loadingIds = [], handleItemClick, onGenerateVideo, statisticsMode = false, style, createEntryCard = false, showDeleteEntry = false, onDelete, ...rest } = props;

  const isMobile = useMobile();
  const mediaViewerRef = useRef<MediaViewerRef>(null);

  // 将列表转换为 MediaViewer 需要的格式
  const mediaItems: MediaItem[] = useMemo(() => {
    return list.map(item => ({
      url: type === 'image' ? item.avatar : item.url || '',
      type: type,
    }));
  }, [list, type]);

  const handleOperation = (operation: typeof FOOTER_OPERATIONS[keyof typeof FOOTER_OPERATIONS], id: string) => {
    const index = list.findIndex(item => item.id === id);
    const picked = list[index];

    switch (operation) {
      case 'download':
        download(type === 'image' ? picked?.avatar || '' : picked?.url || '');
        break;
      case 'previewImage':
        mediaViewerRef.current?.show(index);
        break;
      case 'playVideo':
        mediaViewerRef.current?.show(index);
        break;
      case 'generateVideo':
        onGenerateVideo?.(id);
        break;
      default:
        break;
    }
  }

  return (
    <>
    {/** TODO: justify-center 待确认是否需要删除 保证pc端左对齐 */}
      <div className="flex flex-wrap gap-2" style={style}>
        {createEntryCard && <CreateEntryCard type={type} />}
        {list.map((r) => {
          return loadingIds.includes(r.id) ? (
            <RoleLoadingCard style={{
              ...(isMobile ? cardStyle.small : cardStyle.large),
              borderRadius: 8,
            }} key={r.id} title={t('common.generating')} description={t('common.video')} isLoading={true}  />
          ) : (
            <CardItem
              key={r.id}
              role={r}
              type={type}
              isGroup={isGroup}
              batchMode={batchMode}
              selected={selectedList.includes(r.id)}
              size={isMobile ? 'small' : 'large'}
              onOperation={(operation) => handleOperation(operation, r.id)}
              onClick={() => handleItemClick(r.id)}
              statisticsMode={statisticsMode}
              showDeleteEntry={showDeleteEntry}
              onDelete={onDelete ? () => onDelete(r.id) : undefined}
              {...rest}
            />
          );
        })}
        {/* 当列表数量是奇数时，添加占位符以保持最后一个卡片左对齐 */}
        {list.length % 2 === 1 && (
          <EmptyCardItem size={isMobile ? 'small' : 'large'} />
        )}
      </div>
      <MediaViewer ref={mediaViewerRef} list={mediaItems} />
    </>
  );
}
