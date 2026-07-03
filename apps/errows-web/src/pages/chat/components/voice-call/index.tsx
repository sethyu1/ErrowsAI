import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@errows/design";
import { VoiceIcon, VoiceDisabledIcon, CallIcon } from "@errows/icons";
import { useVoiceChatAgora, type ConversationState } from "./use-voice-chat-agora";

interface VoiceCallProps {
  avatar?: string;
  username?: string;
  sid: string;
  onHangup?: (callId: string, segments?: { transcript_user: string; transcript_character: string[] }[]) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const VoiceCall = ({
  avatar,
  username = "User",
  sid,
  onHangup,
  className,
  style,
}: VoiceCallProps) => {
  const [duration, setDuration] = useState(0);
  
  const {
    state,
    isInitialized,
    getIsInitialized,
    startListening,
    stopListening,
    callIdRef,
    isVoiceEnabled,
    toggleVoiceEnabled,
  } = useVoiceChatAgora(onHangup);

  // 根据对话状态判断是否显示波形动画
  const isActive = state === "user_speaking" || state === "ai_speaking";
  const hasStartedRef = React.useRef(false);
  const hasPlayedConnectingRef = React.useRef(false);
  const connectingAudioRef = React.useRef<HTMLAudioElement | null>(null);

  // 组件挂载时自动开始监听
  useEffect(() => {
    if (sid && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startListening(sid);
    }
    return () => {
      stopListening();
      // Do not reset hasStartedRef here: it can cause the dialog to close and leave the call running
    };
  }, [sid]);

  // Play connecting sound once when in "Connecting" phase (before AI is ready)
  useEffect(() => {
    if (!sid || !hasStartedRef.current || isInitialized || hasPlayedConnectingRef.current) return;
    hasPlayedConnectingRef.current = true;
    const audio = new Audio("/connecting.mp3");
    connectingAudioRef.current = audio;
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }, [sid, isInitialized]);

  // Stop connecting sound when AI is connected and ready
  useEffect(() => {
    if (!isInitialized) return;
    const audio = connectingAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      connectingAudioRef.current = null;
    }
  }, [isInitialized]);

  // 组件真正卸载时重置

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      if (getIsInitialized()) {
        setDuration((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 挂断处理：stopListening() calls onHangup(callId, segments) so we only need to call stopListening
  const handleHangup = useCallback(() => {
    if (callIdRef.current) {
      stopListening();
    }
  }, [stopListening, callIdRef]);

  // 获取状态文字
  const getStatusText = (state: ConversationState) => {
    switch (state) {
      case "idle":
        return isInitialized ? "Waiting for you to speak..." : "Connecting";
      case "user_speaking":
        return "Listening...";
      case "processing":
        return "Thinking...";
      case "ai_speaking":
        return "Character Speaking";
      default:
        return "";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")} : ${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const vioceNode = React.useMemo(
    () => (
      <div className="flex items-center justify-center gap-[2px] h-16">
        {Array.from({ length: 50 }).map((_, index) => {
          // 创建更自然的波形效果 - 中间大，两边小
          const centerIndex = 25;
          const distanceFromCenter = Math.abs(index - centerIndex);

          // 计算波形缩放比例：中间为1，两边逐渐减小到0.2
          const waveScale = 1 - (distanceFromCenter / centerIndex) * 0.8;

          // 不同位置的柱子有不同的动画速度和延迟
          const baseDelay = (index % 10) * 0.15;
          const animationDuration = 1.5 + Math.random() * 0.8;

          // 根据位置计算颜色
          const colorPosition = (index / 50) * 100;

          return (
            <div
              key={index}
              className="w-[2px] rounded-full"
              style={{
                background: isActive
                  ? `hsl(${220 + colorPosition * 1.4}, 80%, ${
                      50 + Math.sin(index) * 10
                    }%)`
                  : `hsl(${220 + colorPosition * 1.4}, 40%, 40%)`, // 无声音时颜色更暗更灰
                height: isActive ? undefined : "4px", // 无声音时固定高度
                minHeight: "4px",
                animation: isActive
                  ? `waveAnimation${
                      index % 3
                    } ${animationDuration}s ease-in-out infinite`
                  : "none",
                animationDelay: isActive ? `${baseDelay}s` : undefined,
                transformOrigin: "bottom",
                // 设置波形缩放变量
                ["--wave-scale" as any]: waveScale,
              }}
            />
          );
        })}
      </div>
    ),
    [isActive]
  );

  return (
    <div className={`w-[300px] h-[380px] bg-[#1B1227B2] backdrop-blur-[16px] border border-[rgba(255,255,255,0.3)] rounded-2xl flex flex-col items-center justify-between py-8 px-6 ${className}`} style={style}>
      {/* Avatar */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#DD429D]">
          {avatar ? (
            <img
              src={avatar}
              alt={username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#DD429D] to-[#485CFB] flex items-center justify-center text-white text-4xl font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Audio Wave Animation */}
      {vioceNode}

      {/* Status Text */}
      <div className="text-gray-400 text-sm">{getStatusText(state)}</div>

      {/* Timer */}
      <div className="text-white font-urbanist font-bold text-[16px]">
        {formatTime(duration)}
      </div>

      {/* Hangup Button */}
      <div className="flex gap-9">
        {isVoiceEnabled ? (
          <Button
            appearance={"gradientOutline"}
            size="icon"
            className="w-13 h-13 rounded-full flex items-center justify-center"
            disabled={!isInitialized}
            onClick={toggleVoiceEnabled}
          >
            <VoiceIcon className="size-5 text-white" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="outline"
            className="w-13 h-13 rounded-full flex items-center justify-center"
            disabled={!isInitialized}
            onClick={toggleVoiceEnabled}
          >
            <VoiceDisabledIcon className="size-5 text-white" />
          </Button>
        )}
        {/* <Button
          size="icon"
          variant={!isVoiceEnabled ? "outline" : undefined}
          appearance={isVoiceEnabled ?"gradientOutline" : undefined}
          className="w-13 h-13 rounded-full flex items-center justify-center"
          disabled={!isInitialized}
          onClick={toggleVoiceEnabled}
        >
          <VoiceDisabledIcon className="size-5 text-white" />
        </Button> */}
        <Button
          appearance="gradientFill"
          size="icon"
          onClick={handleHangup}
          className="w-13 h-13 rounded-full flex items-center justify-center"
          disabled={!isInitialized}
        >
          <CallIcon className="size-5 text-white" />
        </Button>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes waveAnimation0 {
            0%, 100% {
              height: var(--min-height, 6px);
            }
            25% {
              height: calc(var(--min-height, 6px) + var(--wave-scale, 1) * 18px);
            }
            50% {
              height: calc(var(--min-height, 6px) + var(--wave-scale, 1) * 34px);
            }
            75% {
              height: calc(var(--min-height, 6px) + var(--wave-scale, 1) * 14px);
            }
          }
          
          @keyframes waveAnimation1 {
            0%, 100% {
              height: var(--min-height, 8px);
            }
            20% {
              height: calc(var(--min-height, 8px) + var(--wave-scale, 1) * 24px);
            }
            40% {
              height: calc(var(--min-height, 8px) + var(--wave-scale, 1) * 8px);
            }
            60% {
              height: calc(var(--min-height, 8px) + var(--wave-scale, 1) * 36px);
            }
            80% {
              height: calc(var(--min-height, 8px) + var(--wave-scale, 1) * 4px);
            }
          }
          
          @keyframes waveAnimation2 {
            0%, 100% {
              height: var(--min-height, 10px);
            }
            33% {
              height: calc(var(--min-height, 10px) + var(--wave-scale, 1) * 26px);
            }
            66% {
              height: calc(var(--min-height, 10px) + var(--wave-scale, 1) * 38px);
            }
          }
        `,
        }}
      />
    </div>
  );
};
