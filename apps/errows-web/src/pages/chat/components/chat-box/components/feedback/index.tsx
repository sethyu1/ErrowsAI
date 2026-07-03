import { PraiseIcon, StepOnIcon, DownloadIcon } from "@errows/icons";
import React, { useRef, useState } from "react";
import { isMessageReply, isSessionMessage } from "../../utils";
import { toast } from "@errows/design";
import { feedbackMessageApi, getTtsApi } from "@/apis/chat";
import { TtsIcon, TtsPauseIcon, TtsLoadingIcon } from "@errows/icons";
import useGetState from "@/hooks/use-get-state";
import mitt from "mitt";
import type { SendingMessage } from "@/pages/chat/hooks";
import type { ReplyMessage } from "@/pages/chat/components/chat-box/plguins/base";

const emitter = mitt<{ play: string }>();

const VOICE_CACHE_PREFIX = "voice-url-cache:";

const getCacheKey = (sid: string, mid: string) => {
  return `${VOICE_CACHE_PREFIX}${sid}:${mid}`;
};

const getCachedVoiceUrl = (sid: string, mid: string): string | undefined => {
  try {
    const key = getCacheKey(sid, mid);
    const cached = localStorage.getItem(key);
    if (cached) {
      const { url } = JSON.parse(cached);
      return url;
    }
  } catch (error) {
    console.warn("Failed to get cached voice URL:", error);
  }
  return undefined;
};

const setCachedVoiceUrl = (sid: string, mid: string, url: string): void => {
  try {
    const key = getCacheKey(sid, mid);
    const value = JSON.stringify({ url });
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Failed to cache voice URL:", error);
  }
};

const clearCachedVoiceUrl = (sid: string, mid: string): void => {
  try {
    const key = getCacheKey(sid, mid);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Failed to clear cached voice URL:", error);
  }
};

interface FeedbackProps {
  sid: string;
  message: API.SESSION.SESSION_MESSAGE | ReplyMessage;
  onDownload?: () => void;
  tts?: boolean;
  voiceUrl?: string;
}

export const useVoiceUrl = (
  sid: string,
  message: API.SESSION.SESSION_MESSAGE | SendingMessage["reply"],
  voice?: string
) => {
  const mid = React.useMemo(() => {
    return isMessageReply(message) ? message?.reply_message_id! : message?.id!;
  }, [message]);

  const [voiceUrl, setVoiceUrl] = useState<string | undefined>(() => {
    if (voice) return voice;
    const cached = getCachedVoiceUrl(sid, mid);
    if (cached) return cached;
    const messageVoiceUrl = isMessageReply(message)
      ? (message as any)?.reply_voice_url
      : (message as any)?.voice_url;
    return messageVoiceUrl || undefined;
  });
  const [isLoading, setIsLoading, getIsLoading] = useGetState<boolean>(false);
  const [isPlaying, setIsPlaying, getIsPlaying] = useGetState<boolean>(false);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const stopFlag = useRef<boolean>(false);
  const retryCountRef = useRef<number>(0);
  const TtsIconComponent = isLoading
    ? TtsLoadingIcon
    : isPlaying
    ? TtsPauseIcon
    : TtsIcon;

  const fetchAndCacheVoiceUrl = async (): Promise<string | undefined> => {
    if (getIsLoading()) return undefined;
    try {
      setIsLoading(true);
      const result = await getTtsApi(sid, mid);
      const newUrl = result?.voice_url;
      if (newUrl) {
        setVoiceUrl(newUrl);
        setCachedVoiceUrl(sid, mid, newUrl);
        return newUrl;
      }
    } catch (error: any) {
      console.error("Failed to get TTS:", error);
      if (error?.response?.status === 402) {
        const messageVoiceUrl = isMessageReply(message)
          ? (message as any)?.reply_voice_url
          : (message as any)?.voice_url;
        if (messageVoiceUrl) {
          setVoiceUrl(messageVoiceUrl);
          setCachedVoiceUrl(sid, mid, messageVoiceUrl);
          return messageVoiceUrl;
        }
      }
      return undefined;
    } finally {
      setIsLoading(false);
    }
    return undefined;
  };

  const handlePlayError = async () => {
    setIsPlaying(false);
    voiceRef.current = null;

    if (retryCountRef.current >= 2) {
      retryCountRef.current = 0;
      toast.error("Failed to play audio");
      return;
    }

    retryCountRef.current += 1;
    const cachedUrl = getCachedVoiceUrl(sid, mid);
    const messageVoiceUrl = isMessageReply(message)
      ? (message as any)?.reply_voice_url
      : (message as any)?.voice_url;
    
    if (cachedUrl || messageVoiceUrl) {
      const urlToUse = cachedUrl || messageVoiceUrl;
      if (urlToUse && !stopFlag.current) {
        setVoiceUrl(urlToUse);
        if (cachedUrl) {
          setCachedVoiceUrl(sid, mid, cachedUrl);
        } else if (messageVoiceUrl) {
          setCachedVoiceUrl(sid, mid, messageVoiceUrl);
        }
        
        const audio = new Audio(urlToUse);
        voiceRef.current = audio;

        audio.onended = () => {
          setIsPlaying(false);
          voiceRef.current = null;
          retryCountRef.current = 0;
        };

        audio.onerror = () => {
          clearCachedVoiceUrl(sid, mid);
          handlePlayError();
        };

        audio.play().catch((error) => {
          console.error("Audio play error after retry:", error);
          clearCachedVoiceUrl(sid, mid);
          handlePlayError();
        });
        setIsPlaying(true);
        return;
      }
    }

    const newUrl = await fetchAndCacheVoiceUrl();
    if (newUrl && !stopFlag.current) {
      const audio = new Audio(newUrl);
      voiceRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        voiceRef.current = null;
        retryCountRef.current = 0;
      };

      audio.onerror = () => {
        handlePlayError();
      };

      audio.play().catch((error) => {
        console.error("Audio play error after retry:", error);
        handlePlayError();
      });
      setIsPlaying(true);
    } else if (!newUrl) {
      retryCountRef.current = 0;
      toast.error("Failed to get TTS");
    }
  };

  const playTts = async () => {
    let url = voiceUrl;
    emitter.emit("play", mid);
    stopFlag.current = false;
    retryCountRef.current = 0;
    
    if (!voiceUrl) {
      const cachedUrl = getCachedVoiceUrl(sid, mid);
      const messageVoiceUrl = isMessageReply(message)
        ? (message as any)?.reply_voice_url
        : (message as any)?.voice_url;
      
      if (cachedUrl) {
        url = cachedUrl;
        setVoiceUrl(cachedUrl);
      } else if (messageVoiceUrl) {
        url = messageVoiceUrl;
        setVoiceUrl(messageVoiceUrl);
        setCachedVoiceUrl(sid, mid, messageVoiceUrl);
      } else {
        const newUrl = await fetchAndCacheVoiceUrl();
        if (!newUrl) {
          toast.error("Failed to get TTS");
          return;
        }
        url = newUrl;
      }
    }

    if (!url || stopFlag.current) return;

    if (!voiceRef.current) {
      const audio = new Audio(url);
      voiceRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        voiceRef.current = null;
        retryCountRef.current = 0;
      };

      audio.onerror = () => {
        handlePlayError();
      };

      audio.play().catch((error) => {
        console.error("Audio play error:", error);
        handlePlayError();
      });
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        voiceRef.current.pause();
        setIsPlaying(false);
      } else {
        voiceRef.current.play().catch((error) => {
          console.error("Audio play error:", error);
          handlePlayError();
        });
        setIsPlaying(true);
      }
    }
  };

  React.useEffect(() => {
    const handlePlayEvent = (id: string) => {
      if (id !== mid && getIsPlaying()) {
        stopFlag.current = true;
        voiceRef.current?.pause();
        setIsPlaying(false);
      }
    };

    emitter.on("play", handlePlayEvent);

    return () => {
      emitter.off("play", handlePlayEvent);
      voiceRef.current?.pause();
      voiceRef.current = null;
      setIsPlaying(false);
    };
  }, [mid]);

  const content = React.useMemo(() => {
    return (
      <TtsIconComponent
        className={`w-4 h-4 cursor-pointer transition-colors ${
          isLoading ? "animate-spin" : ""
        }`}
        style={{ color: isPlaying ? "#FFFFFF" : "#A4ACB9" }}
        onClick={playTts}
      />
    );
  }, [isLoading, isPlaying, TtsIconComponent, playTts]);

  return { content };
};

export const Feedback: React.FC<FeedbackProps> = (props) => {
  const { sid, message, tts, onDownload } = props;
  const feedbackingRef = useRef<boolean>(false);
  const voiceUrl = isMessageReply(message)
    ? (message as any)?.reply_voice_url
    : (message as any)?.voice_url;
  const { content } = useVoiceUrl(sid, message, voiceUrl ?? undefined);
  const [state, setState] = useState<"like" | "dislike" | undefined>(
    message?.feedback as "like" | "dislike"
  );

  const mid = React.useMemo(() => {
    return isMessageReply(message) ? message?.reply_message_id! : message?.id!;
  }, [message]);

  const handleLike = () => {
    // setLike(!like);
    if (feedbackingRef.current) return;
    feedbackingRef.current = true;
    feedbackMessageApi(sid, mid, "like")
      .then(() => {
        setState((prev) => (prev === "like" ? undefined : "like"));
      })
      .finally(() => {
        feedbackingRef.current = false;
      });
  };
  const handleDislike = () => {
    if (feedbackingRef.current) return;
    feedbackingRef.current = true;
    feedbackMessageApi(sid, mid, "dislike")
      .then(() => {
        setState((prev) => (prev === "dislike" ? undefined : "dislike"));
      })
      .finally(() => {
        feedbackingRef.current = false;
      });
  };

  return (
    message && (
      <div className="flex items-center gap-3">
        <PraiseIcon
          className={`w-4 h-4 cursor-pointer ${
            state === "like"
              ? "text-[#FFFFFF]"
              : "text-[#A4ACB9] hover:text-[#FFFFFF]"
          }`}
          onClick={handleLike}
        />
        <StepOnIcon
          className={`w-4 h-4 cursor-pointer ${
            state === "dislike"
              ? "text-[#FFFFFF]"
              : "text-[#A4ACB9] hover:text-[#FFFFFF]"
          }`}
          onClick={handleDislike}
        />
        {typeof onDownload === "function" && (
          <DownloadIcon
            className="w-4 h-4 text-[#A4ACB9] cursor-pointer hover:text-[#FFFFFF]"
            onClick={onDownload}
          />
        )}
        {tts && content}
      </div>
    )
  );
};
