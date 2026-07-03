import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RoleImageCard } from '@/components';
import { VideoSelector } from '../components/video-selector';
import { cn } from '@errows/design/lib/utils';
import type { VoiceOption } from '../../../types';

interface GalleryItem {
  key: string;
  label: string;
  imageUrl: string | undefined;
}

interface SizeCardItem {
  key: string;
  label: string;
  imageUrl: string | undefined;
}

interface HairColorMeta {
  color?: string;
  value?: string;
}

export interface CharacterAttributesWrapProps {
  /** 画廊项目列表 */
  galleryItems: GalleryItem[];
  /** 声音选项列表 */
  voiceOptions: VoiceOption[];
  /** 是否有声音选择 */
  voiceUrl: string | undefined;
  /** 年龄标签 */
  ageLabel?: string | null;
  /** 发色标签 */
  hairColorLabel?: string | null;
  /** 发色元数据 */
  hairColorMeta?: HairColorMeta | null;
  /** 尺寸卡片项目列表 */
  sizeCardItems: SizeCardItem[];
  /** 是否移动端 */
  isMobile: boolean;
}


const MOBILE_CARD_SIZE = {
  width: 114,
  height: 127,
}

/**
 * 角色属性围绕布局组件
 * 用于在摘要页面中围绕主图片显示各种角色属性卡片
 */
export function CharacterAttributesWrap({
  galleryItems,
  voiceOptions,
  voiceUrl,
  ageLabel,
  hairColorLabel,
  hairColorMeta,
  sizeCardItems,
  isMobile,
}: CharacterAttributesWrapProps) {
  const { t } = useTranslation();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handlePlayStart = (voiceValue: string) => {
    setPlayingVoiceId(voiceValue);
  };

  const handlePlayStop = () => {
    setPlayingVoiceId(null);
  };

  const isMini = window.innerWidth <= 380;
  const cardStyle = {...MOBILE_CARD_SIZE};
  if(isMini) cardStyle.width = 104;

  return (
    <>
      {/* 画廊项目 */}
      {galleryItems.map((item) => (
        <RoleImageCard
          key={`${item.key}-${item.label}`}
          imageUrl={item.imageUrl}
          name={item.label}
          size="small"
          isMobile={isMobile}
          className={cn("inline-block align-top mr-2 mb-2",
            isMobile ? 'mb-2' : 'mb-3'
          )}
          style={isMobile ? cardStyle: {}}
        />
      ))}

      {/* 声音选择器 */}
      {voiceUrl && voiceOptions.length > 0 && (
        <div className={cn("inline-block align-top mr-2 mb-2",
          isMobile ? 'mb-2' : 'mb-3'
        )}>
          <VideoSelector
            source={voiceOptions.find(option => option.value === voiceUrl)!}
            style={isMobile ? cardStyle: {}}
            noSelectable
            isPlaying={playingVoiceId === voiceUrl}
            onPlayStart={handlePlayStart}
            onPlayStop={handlePlayStop}
            preload="auto"
          />
        </div>
      )}

      {/* 年龄标签 */}
      {ageLabel && (
        <div className={cn("inline-block relative w-[113px] h-[135px] rounded-[8px] border border-[#2C2C38] bg-[#1D1E27] text-center align-top mr-2 mb-2",
          isMobile ? 'mb-2' : 'mb-3'
        )}
        style={isMobile ? cardStyle: {}}
        >
          <div className="absolute top-4 inset-0 flex flex-col items-center justify-center">
            <span className="text-white font-urbanist font-normal text-sm mb-1">
              {t(`characterOptions.labels.${ageLabel}`)}
            </span>
            <span className="text-white inline-block mt-4 font-urbanist font-normal text-xs">{t('common.age')}</span>
          </div>
        </div>
      )}

      {/* 发色标签 */}
      {hairColorLabel && (
        <div className={cn("inline-block relative w-[113px] h-[135px] rounded-[8px] border border-[#2C2C38] bg-[#1D1E27] text-center align-top mr-2 mb-2",
          isMobile ? 'mb-2' : 'mb-3'
        )} style={isMobile ? cardStyle: {}}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div
              className="w-8 h-8 rounded-full border border-white/30"
              style={{
                backgroundColor: hairColorMeta?.color || '#ffffff',
              }}
            />
            <span className="text-white font-urbanist font-normal text-xs">{t('characterOptions.labels.hairColor')}</span>
            <span className="text-white font-urbanist font-semibold text-xs">{hairColorLabel}</span>
          </div>
        </div>
      )}

      {/* 尺寸卡片项目 */}
      {sizeCardItems.map((item) => (
        <RoleImageCard
          key={`${item.key}-${item.label}`}
          imageUrl={item.imageUrl}
          name={item.label}
          size="small"
          isMobile={isMobile}
          className={cn("inline-block align-top mr-2 mb-2",
            isMobile ? 'mb-2' : 'mb-3'
          )}
          style={isMobile ? cardStyle: {}}
        />
      ))}
    </>
  );
}

