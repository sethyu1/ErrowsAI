import { cn } from '@errows/design/lib/utils';
import { RoleLoadingCard } from '@/components';
import { useMobile } from '@/hooks/use-mobile-detector';
import { useTranslation } from 'react-i18next';
import { RoleCardMenu } from './role-card-menu-next';
import { RoleCardUserCount} from './card-user-count';
import { RoleCardInfo } from './card-info';
import { RoleCardFooter } from './card-footer';

export interface RoleCardProps {
  /** 角色信息 */
  roleInfo: API.Character.ListItem;
  /** 是否选中/高亮 */
  selected?: boolean;
  /** 表情图标 */
  emoji?: string;
  /** 是否禁用删除 */
  noDelete?: boolean;
  /** 是否启用编辑 */
  editEnable?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 通用动作回调，传入动作key */
  onAction?: (key: string) => void;
}

/**
 * 角色卡片组件
 */
export function RoleCard({
  roleInfo,
  selected = false,
  emoji,
  noDelete = false,
  editEnable = false,
  onClick,
  onAction,
}: RoleCardProps) {
  const { t } = useTranslation();
  const isMobile = useMobile();

  const isMini = window.innerWidth < 380;

  // 从 roleInfo 中提取所需字段
  const imageUrl = roleInfo.avatar_url;
  const name = roleInfo.nickname;
  const age = roleInfo.age;
  // 需要兼容 新增的角色介绍字段
  const description = roleInfo.introduction || roleInfo.description;
  const status = roleInfo.status;
  const users = roleInfo.social?.followed_count;
  const likes = roleInfo.social?.likes_count || 0;
  //TODO: 这里不确定是聊天次数还是评论次数，需要确认
  const comments = roleInfo.social?.dialogues_count || 0;

  if (status == 'generating' || status == 'pending') {
    return (
      <RoleLoadingCard
        title={name}
        description={description || t('role.gallery.buildingFace')}
        isLoading={true}
        selected={selected}
        style={{
          ...isMini? { width: 172 } : {},
        }}
      />
    );
  }

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const menuItems = [
    { key: 'rebuildFace', label: t('role.gallery.rebuildFace'), onClick: () => onAction?.('rebuildFace') },
    { key: 'post', label: t('role.gallery.post'), onClick: () => onAction?.('post') },
    { key: 'chat', label: t('common.chat'), onClick: () => onAction?.('chat') },
    { key: 'generateImage', label: t('role.gallery.generateImage'), onClick: () => onAction?.('generateImage') },
    { key: 'generateVideo', label: t('role.gallery.generateVideo'), onClick: () => onAction?.('generateVideo') },
    { key: 'copyLink', label: t('role.gallery.copyLink'), onClick: () => onAction?.('copyLink') },
    { key: 'delete', label: t('common.delete'), onClick: () => onAction?.('delete'), isDangerous: true },
  ];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-4 cursor-pointer shrink-0 group',
        isMobile ? (isMini ? 'w-43 h-69' : 'w-45 h-69') : 'w-[184px] h-[284px]',
        'bg-gray-900'
      )
      }
      style={{
        borderRadius: 14,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
      onClick={onClick}
    >
      {/** hidden deleted status */}
      {/* {status === 'deleted' && <div
        className="absolute bottom-22 right-1 font-urbanist font-medium text-xs text-white flex items-center justify-center"
        style={{
          padding: '5px 8px',
          borderRadius: 59,
          background: '#FF324D99',

        }}
      >Deleted</div>} */}
      {/* 背景图片 */}
      {/* 左上角用户数 */}
      <RoleCardUserCount users={users} formatNumber={formatNumber} />

      {/* 右上角菜单按钮 */}
      {!noDelete && <RoleCardMenu items={menuItems} editEnable={editEnable} />}

      {/* 底部深色渐变层 */}
      <div
        className="absolute  bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '120px',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5))',
        }}
      />

      {/* 名称和描述 */}
      <RoleCardInfo name={name} description={description}  />

      {/* 底部信息栏 */}
      <RoleCardFooter
        emoji={emoji}
        comments={comments}
        likes={likes}
        formatNumber={formatNumber}
      />
    </div>
  );
}