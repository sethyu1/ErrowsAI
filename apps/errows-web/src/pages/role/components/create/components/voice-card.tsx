import React from 'react';
import { cn } from '@errows/design/lib/utils';
import { CheckMarkIcon } from '@errows/icons';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@errows/design';
import VoiceBg from '@/assets/images/voice/voice-bg.webp'
import VoiceStop from '@/assets/images/voice/voice-stop.webp'
import VoicePlay from '@/assets/images/voice/voice-play.webp'


export interface VoiceCardProps {
  label: string;
  selected?: boolean;
  isPlaying?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onPlayClick?: (e: React.MouseEvent) => void;
  onPause?: () => void;
}

export function VoiceCard({
  label,
  selected = false,
  isPlaying = false,
  style = {},
  onClick,
  onPlayClick,
  onPause,
}: VoiceCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    if (isPlaying && onPause) {
      onPause();
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        'relative cursor-pointer transition-all duration-200 w-[113px] h-[135px] rounded-[8px] overflow-hidden border-2 box-content',
        selected ? 'border-white scale-[1.02]' : 'border-transparent hover:scale-[1.01] active:scale-[0.99] hover:border-[#3A3A48]'
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        ...style,
        backgroundColor: ''
      }}
      aria-pressed={selected}
    >
      <div className={cn("relative w-full h-full overflow-hidden bg-[#1D1E27] rounded-[8px] border-1",
        selected ? 'border-black' : 'border-transparent'
      )}>
        {selected && (
          <div
            className="absolute right-2 top-2 z-1 flex items-center justify-center font-[700]"
            style={{
              width: 14,
              height: 14,
              fontSize: 10,
              borderRadius: '50%',
              backgroundColor: '#fff',
              color: '#0E0F17'
            }}
          >
            <CheckMarkIcon className='size-2' />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className='flex items-center justify-center cursor-pointer hover:scale-[1.1] active:scale-[1.1] transition-all bg-center bg-no-repeat bg-cover'
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onPlayClick?.(e);
              }}
              style={{
                width: 48,
                height: 48,
                backgroundImage: isPlaying ? `url(${VoiceBg})`: 'unset',
              }}
            >
              <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <img className='cursor-pointer' src={isPlaying ? VoiceStop : VoicePlay} alt={isPlaying ? 'play' : 'stop'} style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                  }} />
                </TooltipTrigger>
                <TooltipContent>
                  <span className='text-white text-base font-urbanist'>{isPlaying ? 'Stop' : 'Play'}</span>
                </TooltipContent>
              </Tooltip>
              </TooltipProvider>
              {isPlaying && <div className='absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2' style={{
                width: 8,
                height: 8,
                borderRadius: 1,
                backgroundColor: '#000',
              }} />}
            </div>
          </div>
        </div>

        <div
          className={
            cn('absolute bottom-0 left-0 right-0 flex items-center rounded-lg pt-2 pb-2 px-2 min-h-9',
              selected ? 'backdrop-blur-[15px]' : ''
            )
          }
        >
          <span className="text-white text-center absolute left-1/2 transform -translate-x-1/2 font-urbanist font-medium text-xs leading-4 tracking-normal">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

