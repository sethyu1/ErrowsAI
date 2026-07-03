import React, { useRef, useEffect } from 'react';
import { VoiceCard } from '../voice-card';
import type { FieldOption } from '../../types';
import { CREATE_ROLE_DICT } from '@/constants';

export interface VoiceSelectorProps {
  source: FieldOption;
  selected?: boolean;
  onChange?: (value: string) => void;
  isPlaying?: boolean;
  onPlayStart?: (value: string) => void;
  onPlayStop?: (value: string) => void;
}

/**
 * 单个语音选择器组件
 * 包含音频元素和播放控制
 */
export function VoiceSelector({
  onChange,
  source,
  selected = false,
  isPlaying = false,
  onPlayStart,
  onPlayStop,
}: VoiceSelectorProps) {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // 停止播放
  const stopPlaying = (voiceValue: string) => {
    const audio = audioRefs.current[voiceValue];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    onPlayStop?.(voiceValue);
  };

  // 当父组件控制的播放状态改变时
  useEffect(() => {
    if (!source.value) return;
    const audio = audioRefs.current[source.value];
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isPlaying, source.value]);

  // 监听音频播放结束事件
  useEffect(() => {
    if (!source.value) return;

    const audio = audioRefs.current[source.value];
    if (!audio) return;

    const handleEnded = () => {
      onPlayStop?.(source.value as string);
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [source.value, onPlayStop]);

  // 处理播放/暂停切换
  const handlePlayToggle = (e: React.MouseEvent, voiceValue: string) => {
    e.stopPropagation();

    if (isPlaying) {
      // 正在播放，暂停
      stopPlaying(voiceValue);
    } else {
      // 开始播放
      onPlayStart?.(voiceValue);
    }
  };

  // 处理卡片点击（暂停或选择）
  const handleCardClick = (voiceValue: string) => {
    if (isPlaying) {
      stopPlaying(voiceValue);
    } else if (onChange) {
      onChange(voiceValue);
    }
  };

  if (!source.value) {
    return null;
  }

  return (
    <div>
      {/* 隐藏的 audio 元素 */}
      <audio
        ref={(el) => {
          if (el && source.value) {
            audioRefs.current[source.value] = el;
          }
        }}
        src={source?.url || ''}
        preload="auto"
        style={{ display: 'none' }}
      />
      <VoiceCard
        label={CREATE_ROLE_DICT.labels[source.title as keyof typeof CREATE_ROLE_DICT.labels] || source.title || source.label || source.value}
        selected={selected}
        isPlaying={isPlaying}
        onClick={onChange || isPlaying ? () => handleCardClick(source.value as string) : undefined}
        onPlayClick={(e) => handlePlayToggle(e, source.value as string)}
        onPause={isPlaying ? () => stopPlaying(source.value as string) : undefined}
      />
    </div>
  );
}

