/**
 * Legacy voice call: HTTP upload + SSE streaming.
 * Replaced by use-voice-chat-agora.ts (Agora RTC SDK / 声网).
 * Kept for reference; VoiceCall component now uses useVoiceChatAgora.
 */
import { useEffect, useRef, useState } from "react";
import { callApi } from "@/apis/chat";
import { useAuthStore } from "@/stores/auth";
import { SimpleVAD, defaultVADConfig } from "./vad";
import { float32ToWavBlob } from "./utils";
import useGetState from "@/hooks/use-get-state";

// 判断是否在 Capacitor App 中运行
const isCapacitor =
  typeof window !== "undefined" &&
  (
    window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();

// API 基础地址
const API_BASE_URL = isCapacitor ? "https://errowstest.online/api" : "/api";

// 对话状态类型
export type ConversationState =
  | "idle"
  | "user_speaking"
  | "ai_speaking"
  | "processing";

// 将 Float32Array 转换为 base64 编码的 WAV

// 日志类型
export interface ChatLog {
  timestamp: Date;
  type:
    | "system"
    | "user_start"
    | "user_end"
    | "ai_start"
    | "ai_end"
    | "interrupt";
  message: string;
  audioData?: Float32Array; // 保留音频数据供后续使用
}

export const useVoiceChat = (onHangup?: (callId: string) => void) => {
  const [state, setState] = useState<ConversationState>("idle");
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [isInitialized, setIsInitialized, getIsInitialized] = useGetState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled, getIsVoiceEnabled] = useGetState(true);
  const vadRef = useRef<any>(null);
  const currentAudioRef = useRef<Float32Array[]>([]);
  const isAISpeakingRef = useRef(false);
  const isProcessingRef = useRef(false); // 新增：处理中状态
  const shouldInterruptRef = useRef(false);
  const isSpeechStartedRef = useRef(false);
  const callIdRef = useRef<string | null>(null);
  // 打断控制器
  const abortControllerRef = useRef<AbortController | null>(null);
  // 音频播放队列
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingQueueRef = useRef(false);

  // 音频播放相关
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);

  const addLog = (
    type: ChatLog["type"],
    message: string,
    audioData?: Float32Array
  ) => {
    const log: ChatLog = {
      timestamp: new Date(),
      type,
      message,
      audioData,
    };
    setLogs((prev) => [...prev, log]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const toggleVoiceEnabled = () => {
    const currentState = getIsVoiceEnabled();
    const newState = !currentState;
    setIsVoiceEnabled(newState);
    
    if (newState) {
      // 启用声音采集 - 恢复 VAD 监听
      if (vadRef.current) {
        vadRef.current.resumeListening();
        addLog("system", "声音采集已启用");
      }
    } else {
      // 禁用声音采集 - 暂停 VAD 监听（不关闭音频流）
      if (vadRef.current) {
        vadRef.current.pauseListening();
        addLog("system", "声音采集已禁用");
      }
      // 如果正在说话，停止并重置状态
      if (state === "user_speaking") {
        setState("idle");
        currentAudioRef.current = [];
        isSpeechStartedRef.current = false;
      }
    }
  }

  // 停止音频播放
  const stopPlayback = () => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // 忽略已停止的错误
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // 将音频加入播放队列
  const enqueueAudio = (base64Audio: string) => {
    audioQueueRef.current.push(base64Audio);
    // 如果没有在播放，启动播放队列
    if (!isPlayingQueueRef.current) {
      playAudioQueue();
    }
  };

  // 播放音频队列
  const playAudioQueue = async () => {
    if (isPlayingQueueRef.current) return;
    isPlayingQueueRef.current = true;

    while (audioQueueRef.current.length > 0) {
      // 检查是否被打断
      if (shouldInterruptRef.current) {
        audioQueueRef.current = [];
        break;
      }

      const base64Audio = audioQueueRef.current.shift();
      if (base64Audio) {
        await playBase64Audio(base64Audio);
      }
    }

    isPlayingQueueRef.current = false;
  };

  // 播放单个 base64 编码的音频
  const playBase64Audio = (base64Audio: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // 检查是否被打断
      if (shouldInterruptRef.current) {
        resolve(false);
        return;
      }

      try {
        // 解码 base64 为二进制
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 创建 AudioContext
        const audioContext = new AudioContext();

        // 解码音频数据
        audioContext.decodeAudioData(
          bytes.buffer,
          (audioBuffer) => {
            // 检查是否被打断
            if (shouldInterruptRef.current) {
              audioContext.close();
              resolve(false);
              return;
            }

            // 创建源节点并播放
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            source.onended = () => {
              audioContext.close();
              resolve(true);
            };

            console.log(
              `[播放] 播放 AI 音频，时长: ${audioBuffer.duration.toFixed(2)}秒`
            );
            source.start();
          },
          (error) => {
            console.error("[播放] 音频解码失败:", error);
            audioContext.close();
            resolve(false);
          }
        );
      } catch (error) {
        console.error("[播放] 播放失败:", error);
        resolve(false);
      }
    });
  };

  // 播放录制的音频
  // const playRecordedAudio = (audioData: Float32Array): Promise<boolean> => {
  //   return new Promise((resolve) => {
  //     try {
  //       const sampleRate = defaultVADConfig.sampleRate;
  //       audioContextRef.current = new AudioContext({ sampleRate });

  //       // 创建 AudioBuffer
  //       const audioBuffer = audioContextRef.current.createBuffer(
  //         1,
  //         audioData.length,
  //         sampleRate
  //       );
  //       audioBuffer.getChannelData(0).set(audioData);

  //       // 创建源节点
  //       sourceNodeRef.current = audioContextRef.current.createBufferSource();
  //       sourceNodeRef.current.buffer = audioBuffer;
  //       sourceNodeRef.current.connect(audioContextRef.current.destination);

  //       const duration = audioBuffer.duration * 1000; // 毫秒
  //       const startTime = Date.now();

  //       console.log(
  //         `[播放] 开始播放录音，时长: ${(duration / 1000).toFixed(2)}秒`
  //       );

  //       // 进度更新
  //       playbackIntervalRef.current = window.setInterval(() => {
  //         // 检查是否需要打断
  //         if (shouldInterruptRef.current) {
  //           stopPlayback();
  //           resolve(false); // 被打断
  //           return;
  //         }

  //         const elapsed = Date.now() - startTime;
  //         const progress = Math.min(elapsed / duration, 1);
  //         setAiProgress(progress);

  //         if (progress >= 1) {
  //           stopPlayback();
  //           resolve(true); // 正常完成
  //         }
  //       }, 50);

  //       // 播放结束回调
  //       sourceNodeRef.current.onended = () => {
  //         if (!shouldInterruptRef.current) {
  //           stopPlayback();
  //           resolve(true);
  //         }
  //       };

  //       sourceNodeRef.current.start();
  //     } catch (error) {
  //       console.error("[播放] 播放失败:", error);
  //       stopPlayback();
  //       resolve(false);
  //     }
  //   });
  // };

  // // 模拟处理动画 (1秒)
  // const simulateProcessing = (): Promise<boolean> => {
  //   return new Promise((resolve) => {
  //     const duration = 1000; // 1秒
  //     const startTime = Date.now();

  //     const interval = setInterval(() => {
  //       // 检查是否被打断
  //       if (shouldInterruptRef.current) {
  //         clearInterval(interval);
  //         resolve(false);
  //         return;
  //       }

  //       const elapsed = Date.now() - startTime;
  //       const progress = Math.min(elapsed / duration, 1);
  //       setAiProgress(progress);

  //       if (progress >= 1) {
  //         clearInterval(interval);
  //         resolve(true);
  //       }
  //     }, 50);
  //   });
  // };

  // const handleUserSpeechEnd = async (audioData: Float32Array) => {
  //   if (audioData.length === 0) {
  //     console.log("[WARN] 音频数据为空，忽略");
  //     setState("idle");
  //     return;
  //   }

  //   const durationSec = (
  //     audioData.length / defaultVADConfig.sampleRate
  //   ).toFixed(2);
  //   addLog("user_end", `用户说话结束，录音时长: ${durationSec}秒`, audioData);

  //   // 1. 进入处理状态 - 1秒动画
  //   setState("processing");
  //   isProcessingRef.current = true;
  //   shouldInterruptRef.current = false;
  //   setAiProgress(0);
  //   addLog("system", "大模型处理中...");

  //   const processingOk = await simulateProcessing();
  //   isProcessingRef.current = false;

  //   if (!processingOk || shouldInterruptRef.current) {
  //     addLog("interrupt", "处理被用户打断");
  //     shouldInterruptRef.current = false;
  //     setState("idle");
  //     return;
  //   }

  //   // 2. 播放原始录音
  //   setState("ai_speaking");
  //   isAISpeakingRef.current = true;
  //   shouldInterruptRef.current = false;
  //   setAiProgress(0);
  //   addLog("ai_start", "开始播放录音...");

  //   const playbackOk = await playRecordedAudio(audioData);

  //   isAISpeakingRef.current = false;

  //   if (playbackOk) {
  //     addLog("ai_end", "录音播放完成");
  //   } else {
  //     addLog("interrupt", "录音播放被打断");
  //   }

  //   shouldInterruptRef.current = false;
  //   // 只有在非用户说话状态时才切换到 idle
  //   setState((prev) => (prev === "ai_speaking" ? "idle" : prev));
  // };

  /*
  1. 创建通话对话
  2. 启动VAD监听
  */
  const startListening = async (sid: string) => {
    // 防止重复启动
    if (vadRef.current) {
      console.log("[VAD] 已经在运行，跳过");
      return;
    }

    try {
      // 使用自定义 SimpleVAD - 使用默认配置
      const vadInstance = new SimpleVAD();
      vadRef.current = vadInstance;
      addLog("system", "创建通话对话...");
      const { id } = await callApi(sid);
      callIdRef.current = id;

      addLog("system", "初始化VAD系统...");

      await vadInstance.start({
        onSpeechStart: () => {
          console.log("[VAD] 检测到语音开始");
          isSpeechStartedRef.current = true;
          currentAudioRef.current = [];

          // 如果 AI 正在回复，立即打断
          if (isAISpeakingRef.current) {
            shouldInterruptRef.current = true;
            // 中止 SSE 请求
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            // 停止音频播放
            stopPlayback();
            // 清空音频队列
            audioQueueRef.current = [];
            isPlayingQueueRef.current = false;
            isAISpeakingRef.current = false;
            addLog("interrupt", "用户开始说话，打断 AI 回复");
          }

          // 如果正在处理中，设置打断标志
          if (isProcessingRef.current) {
            shouldInterruptRef.current = true;
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            isProcessingRef.current = false;
            addLog("interrupt", "用户开始说话，打断处理");
          }

          setState("user_speaking");
          addLog("user_start", "检测到用户开始说话");
        },
        onSpeechEnd: async (audio: Float32Array) => {
          console.log("[VAD] 检测到语音结束");
          isSpeechStartedRef.current = false;

          if (audio.length === 0) {
            console.log("[WARN] 音频数据为空，忽略");
            setState("idle");
            return;
          }

          // 转换音频为 WAV Blob
          const audioBlob = float32ToWavBlob(
            audio,
            defaultVADConfig.sampleRate
          );
          const durationSec = (
            audio.length / defaultVADConfig.sampleRate
          ).toFixed(2);
          addLog("user_end", `用户说话结束，时长: ${durationSec}秒`);

          // 进入处理状态
          setState("processing");
          isProcessingRef.current = true;
          shouldInterruptRef.current = false;
          addLog("system", "发送语音到服务器...");

          try {
            // 创建新的 AbortController
            abortControllerRef.current = new AbortController();
            const token = useAuthStore.getState().token;

            // 发送 SSE 请求 - 直接传二进制 WAV
            const response = await fetch(
              `${API_BASE_URL}/my/sessions/${sid}/call/${id}`,
              {
                method: "POST",
                headers: {
                  Authorization: token ? `Bearer ${token}` : "",
                  Accept: "text/event-stream",
                },
                body: audioBlob,
                signal: abortControllerRef.current.signal,
              }
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            isProcessingRef.current = false;

            // 检查是否被打断
            if (shouldInterruptRef.current) {
              addLog("interrupt", "请求被打断");
              setState("idle");
              return;
            }

            // 进入 AI 回复状态
            setState("ai_speaking");
            isAISpeakingRef.current = true;
            addLog("ai_start", "开始接收 AI 回复...");

            // 读取 SSE 流
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
              throw new Error("无法获取响应流");
            }

            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();

              if (done) break;

              // 检查是否被打断
              if (shouldInterruptRef.current) {
                reader.cancel();
                break;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("event:")) {
                  const eventType = line.slice(6).trim();
                  continue;
                }

                if (line.startsWith("data:")) {
                  const data = line.slice(5).trim();

                  try {
                    const parsed = JSON.parse(data);

                    // 处理不同的事件类型
                    if (parsed.event === "response_sentence" && parsed.data) {
                      // 加入播放队列（非阻塞）
                      enqueueAudio(parsed.data);
                    } else if (parsed.event === "voice_call_info") {
                      console.log("[SSE] voice_call_info:", parsed.data);
                    } else if (parsed.event === "cost") {
                      console.log("[SSE] cost:", parsed.data);
                    } else if (parsed.event === "error") {
                      console.error("[SSE] error:", parsed.data);
                      addLog(
                        "system",
                        `错误: ${parsed.data?.message || "未知错误"}`
                      );
                    } else if (parsed.event === "end") {
                      console.log("[SSE] 对话结束");
                    }
                  } catch (e) {
                    // 可能是纯 base64 音频数据
                    if (data && data.length > 100) {
                      enqueueAudio(data);
                    }
                  }
                }
              }
            }

            // 等待音频队列播放完毕
            while (
              isPlayingQueueRef.current ||
              audioQueueRef.current.length > 0
            ) {
              if (shouldInterruptRef.current) break;
              await new Promise((r) => setTimeout(r, 100));
            }

            isAISpeakingRef.current = false;

            if (!shouldInterruptRef.current) {
              addLog("ai_end", "AI 回复完成");
            }

            setState((prev) => (prev === "ai_speaking" ? "idle" : prev));
          } catch (error: any) {
            if (error.name === "AbortError") {
              console.log("[SSE] 请求被中止");
            } else {
              console.error("[SSE] 请求失败:", error);
              addLog("system", `请求失败: ${error.message}`);
            }
            isProcessingRef.current = false;
            isAISpeakingRef.current = false;
            setState("idle");
          }
        },
        onVADMisfire: () => {
          console.log("[VAD] 误触发，忽略");
          isSpeechStartedRef.current = false;
          currentAudioRef.current = [];
          if (state === "user_speaking" && !isAISpeakingRef.current) {
            setState("idle");
          }
        },
      });

      setIsInitialized(true);
      setState("idle");
      addLog("system", "VAD系统启动成功，开始监听...");
    } catch (error: any) {
      console.error("[ERROR] VAD初始化失败:", error);
      addLog("system", `初始化失败: ${error}`);
      
      // 检查是否是麦克风权限被拒绝
      if (error?.name === 'NotAllowedError' || 
          error?.name === 'PermissionDeniedError' ||
          error?.message?.includes('Permission denied') ||
          error?.message?.includes('permission')) {
        console.log("[ERROR] 麦克风权限被拒绝，自动挂断");
        addLog("system", "麦克风权限被拒绝，通话已结束");
        
        // 保存 callId 用于回调
        const callId = callIdRef.current;
        
        // 清理资源
        if (vadRef.current) {
          vadRef.current.pause();
          vadRef.current = null;
        }
        setIsInitialized(false);
        callIdRef.current = null;
        setState("idle");
        
        // 调用挂断回调
        if (callId) {
          onHangup?.(callId);
        }
      }
    }
  };

  const stopListening = () => {
    if (vadRef.current && getIsInitialized()) {
      vadRef.current.pause();
      vadRef.current = null;
      setIsInitialized(false);
      callIdRef.current = null;
      setState("idle");
      addLog("system", "停止监听");
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // 清理
  useEffect(() => {
    return () => {
      if (vadRef.current) {
        vadRef.current.pause();
      }
      shouldInterruptRef.current = true;
      stopPlayback();
    };
  }, []);

  return {
    state,
    logs,
    isInitialized,
    getIsInitialized,
    aiProgress,
    startListening,
    stopListening,
    clearLogs,
    callIdRef,
    isVoiceEnabled,
    toggleVoiceEnabled,
  };
};
