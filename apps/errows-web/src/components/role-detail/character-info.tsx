import React from 'react';
import { cn } from '@errows/design/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@errows/design';
import {
  NHeartCalmIcon,
  NHeartDoubleIcon,
  NMediaIcon,
  ImageFilledProIcon,
} from '@errows/icons';
import { ArrowBottomFillIcon } from '@errows/icons';
import { useTranslation } from 'react-i18next';

export interface CharacterInfoProps {
  /** 角色名称 */
  nickname?: string;
  /** 角色分类 (e.g., "Mexican") */
  assortment?: string;
  /** 角色类型 (e.g., "anime") */
  type?: string;
  /** 更新日期 */
  updatedAt?: any;
  /** 角色介绍 */
  introduction?: string;
  /** 角色描述 */
  description?: string;
  /** 年龄 (e.g., "34 years old") */
  age?: string | number;
  /** 肤色 */
  color?: string;
  /** 性别 */
  gender?: string;
  /** 统计数据 */
  stats?: {
    // 心情
    mood?: number | string;
    /** 亲密度 */
    intimacy?: number;
    /** 视频数量 */
    videoCount?: number;
    /** 图片数量 */
    imageCount?: number;
  };
  /** 是否为移动端布局 */
  isMobile?: boolean;
  /** 跟随按钮 */
  followContent?: React.ReactNode;
}

const STATS_CONFIG = [
  {
    icon: NHeartCalmIcon,
    key: 'mood' as const,
  },
  {
    icon: NHeartDoubleIcon,
    key: 'intimacy' as const,
  },
  {
    icon: NMediaIcon,
    key: 'videoCount' as const,
  },
  {
    icon: ImageFilledProIcon,
    key: 'imageCount' as const,
  },
];

/**
 * 角色基本信息展示区
 * 包括名称、描述、特征标签、统计数据
 */
export const CharacterInfo: React.FC<CharacterInfoProps> = ({
  nickname = 'Unknown',
  description = '',
  stats = {},
  isMobile = false,
  followContent,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { t } = useTranslation();

  return (
    <div className={cn(
      'flex flex-col gap-3',
      isMobile ? 'w-full' : ''
    )}>
      {/* 标题行: 名称、类型、日期 */}
      <div className="flex items-start justify-between gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <h1 
                className="font-[500] text-white font-urbanist flex-1 min-w-0" 
                style={{
                  fontSize: 28,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {nickname}
              </h1>
            </TooltipTrigger>
            <TooltipContent>
              <p>{nickname}</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-urbanist flex-wrap flex-shrink-0">
            {followContent}
          </div>
      </div>
      {/* 描述 */}
      {description && (
        <div className="flex flex-col gap-2 relative">
          <p className={cn(
            'text-base leading-relaxed font-urbanist transition-all duration-300',
            isExpanded ? '' : 'line-clamp-3'
          )} style={
            { color: '#C1C7D0' }
          }>
            {description}
          </p>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-white font-urbanist font-[700] transition-colors duration-200 font-urbanist w-fit"
          >
            <span>{isExpanded ? t('common.collapse') : t('common.expand')}</span>
            <ArrowBottomFillIcon
              className={cn(
                'w-4 h-4 transition-transform duration-300',
                isExpanded ? 'rotate-180' : ''
              )}
            />
          </button>
        </div>
      )}
      {/* 统计数据区 */}
      <div className="flex items-center justify-between pt-2">
        {STATS_CONFIG.map(({ icon: Icon, key }) => (
          <div key={key} className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-white font-urbanist">
              {stats[key] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterInfo;

