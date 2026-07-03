import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@errows/design/lib/utils';
import { CloseIcon } from '@errows/icons';
import { useMobile } from '@/hooks/use-mobile-detector';
import { Loading } from '@/components/loading';

const DEFAULT_PROGRESS_DURATION_MS = 24000;
const DEFAULT_SPEED_UP_RAMP_MS = 16000;
const TICK_MS = 150;

export interface RoleLoadingCardProps {
  noPadding?: boolean;
  title?: string;
  description?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  footer?: {
    text: string;
    icon?: ReactNode | null;
    onClick?: () => void | Promise<void>;
    style?: React.CSSProperties;
    skipSpeedUpBehavior?: boolean;
    disabled?: boolean;
  };
  onClose?: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
  smaller?: boolean;
  createdAt?: string;
  defaultSpedUp?: boolean;
  progressDurationMs?: number;
  speedUpRampMs?: number;
  progressPercent?: number;
}

/**
 * Role Loading Card 组件
 * 用于显示加载状态的卡片组件，支持自定义图标、标题、描述、页脚和关闭功能
 */
export function RoleLoadingCard({
  noPadding = false,
  title,
  description,
  icon,
  isLoading = false,
  footer,
  onClose,
  selected = false,
  style = {},
  smaller,
  createdAt,
  defaultSpedUp = false,
  progressDurationMs = DEFAULT_PROGRESS_DURATION_MS,
  speedUpRampMs = DEFAULT_SPEED_UP_RAMP_MS,
  progressPercent: progressPercentProp,
}: RoleLoadingCardProps) {
  const { t } = useTranslation();
  const isMobile = useMobile();
  const defaultTitle = title ?? t('common.loading');
  const [fakePercent, setFakePercent] = useState(1);
  const displayPercent = progressPercentProp ?? fakePercent;
  const mountTimeRef = useRef<number | null>(null);
  const [hasSpeedUp, setHasSpeedUp] = useState(defaultSpedUp);
  const [showSpeedUpEffect, setShowSpeedUpEffect] = useState(false);
  const speedUpEffectTimerRef = useRef<number | null>(null);
  const [allowTo99, setAllowTo99] = useState(defaultSpedUp);
  const speedUpTimeRef = useRef<number | null>(null);
  const speedUpStartPctRef = useRef<number>(80);

  useEffect(() => {
    if (defaultSpedUp) {
      setHasSpeedUp(true);
      setAllowTo99(true);
    }
  }, [defaultSpedUp]);

  useEffect(() => {
    if (!isLoading) return;
    if (mountTimeRef.current === null) {
      mountTimeRef.current = createdAt
        ? new Date(createdAt).getTime()
        : Date.now();
    }
  }, [isLoading, createdAt]);

  useEffect(() => {
    if (!isLoading || progressPercentProp !== undefined) return;
    const tick = () => {
      const now = Date.now();
      const mountTime = mountTimeRef.current ?? now;
      const elapsed = now - mountTime;

      if (allowTo99 && speedUpTimeRef.current) {
        const speedUpElapsed = now - speedUpTimeRef.current;
        const start = speedUpStartPctRef.current;
        const pct = start + ((99 - start) * Math.min(1, speedUpElapsed / speedUpRampMs));
        setFakePercent(Math.round(Math.min(99, pct)));
      } else if (allowTo99) {
        const pct = 1 + (98 * Math.min(1, elapsed / (progressDurationMs + speedUpRampMs)));
        setFakePercent(Math.round(Math.min(99, pct)));
      } else {
        const pct = 1 + (79 * Math.min(1, elapsed / progressDurationMs));
        setFakePercent(Math.round(Math.min(80, pct)));
      }
    };
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [isLoading, allowTo99, progressDurationMs, speedUpRampMs, progressPercentProp]);

  const handleFooterClick = async () => {
    if (footer?.disabled) return;
    try {
      await footer?.onClick?.();
      if (footer?.skipSpeedUpBehavior) return;
      if (isLoading && !allowTo99) {
        speedUpTimeRef.current = Date.now();
        speedUpStartPctRef.current = fakePercent;
        setAllowTo99(true);
      }
      if (isLoading && !hasSpeedUp) {
        setHasSpeedUp(true);
        setShowSpeedUpEffect(true);
        if (speedUpEffectTimerRef.current !== null) {
          window.clearTimeout(speedUpEffectTimerRef.current);
        }
        speedUpEffectTimerRef.current = window.setTimeout(() => {
          setShowSpeedUpEffect(false);
          speedUpEffectTimerRef.current = null;
        }, 1200);
      }
    } catch {
      // noop
    }
  };

  useEffect(() => {
    return () => {
      if (speedUpEffectTimerRef.current !== null) {
        window.clearTimeout(speedUpEffectTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[22.96px] cursor-pointer shrink-0',
        isMobile ? 'w-[179px] h-[265px]' : 'w-[184px] h-[284px]',
        selected && 'border-2 border-blue-400'
      )}
      style={{
        background: '#1D1E27',
        backdropFilter: 'blur(50px)',
        ...style,
      }}
    >
      {/* 关闭按钮 */}
      {onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 z-10 cursor-pointer flex items-center justify-center hover:opacity-80 transition-opacity"
          aria-label="Close"
        >
          <CloseIcon className="w-5 h-5 text-white" />
        </button>
      )}

      <div className={cn(
        'w-full h-full flex flex-col items-center justify-center relative',
        isMobile ? 'gap-4' : 'gap-4'
      )}>
        <div
          className={cn(noPadding ? 'pt-4 pb-0' : '')}
          style={!isMobile ? { transform: 'translateY(-10px)' } : isMobile && footer ? { flexShrink: 0 } : undefined}
        >
          {icon ? (
            <div className={cn('w-16 h-16 flex items-center justify-center', smaller ? 'w-8 h-8' : '')}>
              {icon}
            </div>
          ) : (
            <div className={cn('relative flex items-center justify-center', smaller ? 'w-14 h-14' : 'w-[72px] h-[72px]')}>
              <Loading
                variant="gray"
                progressPercent={isLoading ? displayPercent : undefined}
                style={{ fontSize: smaller ? 52 : isMobile ? 64 : 60 }}
                className="w-full h-full"
              />
              {isLoading && (
                <span
                  className={cn(
                    'absolute inset-0 flex items-center justify-center font-urbanist font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out',
                    smaller ? 'text-[15px]' : 'text-[20px]',
                    showSpeedUpEffect && 'scale-[1.35] drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                  )}
                >
                  {displayPercent}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* 文本内容区域 - 位于底部信息栏上面 */}
        {!footer && <div className={cn("text-[#868E96] text-center px-4")}>
          {defaultTitle && (
            <div className="font-urbanist font-medium text-base mb-1">
              {defaultTitle}
            </div>
          )}
          {description && (
            <div className="text-[#868E96] font-urbanist font-normal text-sm line-clamp-1">
              {description}
            </div>
          )}
        </div>
        }

        {footer && !(isLoading && hasSpeedUp && !footer.skipSpeedUpBehavior) && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleFooterClick();
            }}
            className={cn(
              'left-0 right-0 mx-auto flex items-center justify-center rounded-full transition-all text-white shrink-0',
              !isMobile && 'absolute',
              footer.icon != null && 'gap-1.5',
              footer.disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:opacity-90'
            )}
            style={{
              width: smaller ? 108 : 200,
              height: 26,
              ...(!isMobile && { bottom: 36 }),
              background: 'linear-gradient(96.61deg, rgb(221, 66, 157) 0%, rgb(177, 75, 244) 50%, rgb(72, 92, 251) 100%)',
              ...footer.style,
            }}
          >
            {footer.icon != null && (
              <div className="flex-shrink-0 flex items-center justify-center">
                {footer.icon}
              </div>
            )}
            <span
              className={cn("font-urbanist font-normal text-lg text-white text-center", smaller ? 'text-sm' : '')}
            >
              {footer.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

