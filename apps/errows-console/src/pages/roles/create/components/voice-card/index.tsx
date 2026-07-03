import React from 'react';
import { CheckCircleFilled } from '@ant-design/icons';
import VoiceBg from '@/assets/images/voice/voice-bg.webp';
import VoiceStop from '@/assets/images/voice/voice-stop.webp';
import VoicePlay from '@/assets/images/voice/voice-play.webp';
import styles from './index.module.less';

export interface VoiceCardProps {
  label: string;
  selected?: boolean;
  isPlaying?: boolean;
  onClick?: () => void;
  onPlayClick?: (e: React.MouseEvent) => void;
  onPause?: () => void;
}

/**
 * 语音卡片组件
 * 显示语音选项，支持播放/暂停和选择
 */
export function VoiceCard({
  label,
  selected = false,
  isPlaying = false,
  onClick,
  onPlayClick,
  onPause,
}: VoiceCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是播放按钮，不处理卡片点击
    if ((e.target as HTMLElement).closest(`.${styles.playButton}`)) {
      return;
    }

    if (isPlaying && onPause) {
      onPause();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`${styles.voiceCard} ${selected ? styles.selected : ''} ${isPlaying ? styles.playing : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
    >
      <div className={styles.cardInner}>
        {/* 选中标记 */}
        {selected && (
          <div className={styles.selectedMark}>
            <CheckCircleFilled />
          </div>
        )}

        {/* 播放按钮区域 */}
        <div className={styles.playArea}>
          <div
            className={styles.playButton}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onPlayClick?.(e);
            }}
            style={{
              backgroundImage: isPlaying ? `url(${VoiceBg})` : 'unset',
            }}
          >
            <img
              src={isPlaying ? VoiceStop : VoicePlay}
              alt={isPlaying ? 'Stop' : 'Play'}
              className={styles.playIcon}
            />
            {isPlaying && <div className={styles.playingIndicator} />}
          </div>
        </div>

        {/* 标签 */}
        <div className={styles.labelArea}>
          <span className={styles.label}>{label}</span>
        </div>
      </div>
    </div>
  );
}

