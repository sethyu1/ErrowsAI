import { DownloadFilledIcon, NVideoStarIcon, MagnifyingGlassIcon, NPlayerIcon } from '@errows/icons';
import { FOOTER_OPERATIONS } from '../constants';

export interface RoleCardFooterProps {
  type: 'image' | 'video';
  onOperation: (operation: typeof FOOTER_OPERATIONS[keyof typeof FOOTER_OPERATIONS]) => void;
}

const FOOTER_ITEMS_CONFIG = [
  {
    icon: <DownloadFilledIcon />,
    labelKey: 'multimedia.download',
    operation: FOOTER_OPERATIONS.DOWNLOAD,
  },
  {
    icon: <MagnifyingGlassIcon />,
    labelKey: 'multimedia.preview',
    operation: FOOTER_OPERATIONS.PREVIEW,
    type: 'image',
  },
  {
    icon: <NVideoStarIcon />,
    labelKey: 'multimedia.generate',
    operation: FOOTER_OPERATIONS.GENERATE,
    type: 'image',
  },
  {
    icon: <NPlayerIcon className='w-4 h-4' />,
    labelKey: 'multimedia.play',
    operation: FOOTER_OPERATIONS.PLAY,
    type: 'video',
  },
]

/**
 * 角色卡片底部信息栏组件
 */
export function CardFooter({
  type,
  onOperation,
}: RoleCardFooterProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 px-5 py-4 backdrop-blur-[24px] rounded-[8px] border-[0.36px]"
      style={{
        background: 'rgba(71, 65, 65, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
      }}
    >
      {/* 底部互动栏 */}
      <div className={`flex items-center ${type === 'video' ? 'justify-center gap-8' : 'justify-between'}`}>
        {FOOTER_ITEMS_CONFIG.filter(item => !item.type || item.type === type).map(item => (
          <div key={item.operation} onClick={(e) => { e.stopPropagation(); onOperation(item.operation) }} className="cursor-pointer">
            {item.icon}
          </div>
        ))}
      </div>
    </div>
  );
}

