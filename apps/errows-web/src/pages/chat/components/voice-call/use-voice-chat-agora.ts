/**
 * Voice call using Agora RTC SDK (声网)
 * Replaces the legacy HTTP/SSE flow in use-voice-chat.ts
 *
 * RTM is used only for real-time captions (ConvoAI transcript): we subscribe to the same
 * channel and listen for "message" events. This block is in a try/catch—if RTM fails or
 * no messages arrive, the voice call (RTC, billing, hangup) is unchanged. No external
 * toolkit is included; if ConvoAI sends transcript on a different channel type (e.g. stream),
 * you would need to adapt subscribe/listener or use the official ConvoAI Web toolkit.
 */

import { useCallback, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import type { IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import AgoraRTM from "agora-rtm-sdk";
import { getAgoraTokenApi, agoraVoiceCallBillingApi } from "@/apis/chat";
import { useChatServices } from "../../services";
import { parseTranscriptMessage, mergeVoiceCaptionsIntoChat, mergeTranscriptsIntoAccumulated, transcriptsToSegments } from "./voice-caption-rtm";
import type { TranscriptItem } from "./voice-caption-rtm";

// Reduce Agora SDK console noise: 2001 AUDIO_INPUT_LEVEL_TOO_LOW and 701 STUN/TURN timeout are non-fatal
if (typeof AgoraRTC.setLogLevel === "function") {
  AgoraRTC.setLogLevel(3); // 0=DEBUG 1=INFO 2=WARNING 3=ERROR 4=NONE — use ERROR so WARNINGs are hidden
}
import useGetState from "@/hooks/use-get-state";
import { toast } from "sonner";

const { RTM } = AgoraRTM;

export type ConversationState =
  | "idle"
  | "user_speaking"
  | "ai_speaking"
  | "processing";

export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
}

export interface UseVoiceChatAgoraReturn {
  state: ConversationState;
  isInitialized: boolean;
  getIsInitialized: () => boolean;
  startListening: (sid: string) => Promise<void>;
  stopListening: () => void;
  callIdRef: React.MutableRefObject<string | null>;
  isVoiceEnabled: boolean;
  toggleVoiceEnabled: () => void;
  getAudioDevices: () => Promise<AudioDeviceInfo[]>;
  testMicrophone: (deviceId?: string) => Promise<{ success: boolean; maxVolume: number; details: any }>;
}

export function useVoiceChatAgora(
  onHangup?: (callId: string, segments?: { transcript_user: string; transcript_character: string[] }[]) => void
): UseVoiceChatAgoraReturn {
  const [state, setState] = useState<ConversationState>("idle");
  const [isInitialized, setIsInitialized, getIsInitialized] =
    useGetState(false);
  const [isVoiceEnabled, setIsVoiceEnabled, getIsVoiceEnabled] =
    useGetState(true);

  const setSendingMessages = useChatServices()?.setSendingMessages;
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const rtmClientRef = useRef<InstanceType<typeof RTM> | null>(null);
  const callIdRef = useRef<string | null>(null);
  const channelNameRef = useRef<string | null>(null);
  const testTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const sidRef = useRef<string | null>(null);
  /** Persisted sid for billing; set in startListening, cleared only after billing (so early cleanup cannot lose it) */
  const billingSidRef = useRef<string | null>(null);
  /** When AI started speaking (for billing: 1 coin/sec from this time until hangup) */
  const billableStartTimeRef = useRef<number | null>(null);
  /** Max billable seconds from token (balance at call start). Call is cut off when reached. */
  const maxDurationSecondsRef = useRef<number | null>(null);
  const maxDurationCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Accumulated transcript segments across RTM messages so captions are appended, not overwritten */
  const accumulatedTranscriptsRef = useRef<TranscriptItem[]>([]);
  /** Client uid (string) from token, used to build segments for persistence on hangup */
  const clientUidStrRef = useRef<string>("");

  const stopListening = useCallback(() => {
    // Capture immediately; use billingSidRef as fallback so billing works even if sidRef was cleared by an earlier cleanup (e.g. Strict Mode)
    const sidFromRef = sidRef.current;
    const sidFromBilling = billingSidRef.current;
    const sid = sidFromRef ?? sidFromBilling;
    const billableStart = billableStartTimeRef.current;
    const cid = callIdRef.current;

    const client = clientRef.current;
    const localTrack = localAudioTrackRef.current;
    const testTrack = testTrackRef.current;

    // Clear max-duration check interval
    if (maxDurationCheckIntervalRef.current) {
      clearInterval(maxDurationCheckIntervalRef.current);
      maxDurationCheckIntervalRef.current = null;
    }
    maxDurationSecondsRef.current = null;

    // Clean up test track if exists
    if (testTrack) {
      try {
        testTrack.close();
      } catch (err) {
        // ignore
      }
      testTrackRef.current = null;
    }

    // Clean up local audio track
    if (localTrack) {
      try {
        if (typeof localTrack.stop === 'function') {
          localTrack.stop();
        }
        localTrack.close();
      } catch (err) {
        // ignore
      }
      localAudioTrackRef.current = null;
    }

    // Leave channel and clean up client
    if (client) {
      client.leave().catch(() => {});
      clientRef.current = null;
    }

    const rtm = rtmClientRef.current;
    if (rtm) {
      const ch = channelNameRef.current;
      if (ch) {
        rtm.unsubscribe(ch).catch(() => {});
      }
      rtm.logout().catch(() => {});
      rtmClientRef.current = null;
    }

    callIdRef.current = null;
    channelNameRef.current = null;
    sidRef.current = null;
    const segmentsForApi =
      accumulatedTranscriptsRef.current.length > 0 && clientUidStrRef.current
        ? transcriptsToSegments(accumulatedTranscriptsRef.current, clientUidStrRef.current, "999999")
        : undefined;
    accumulatedTranscriptsRef.current = [];
    clientUidStrRef.current = "";
    billableStartTimeRef.current = null;
    setIsInitialized(false);
    setState("idle");

    // Report billable duration (use captured sid/billableStart so billing works even when stopListening is called multiple times)
    const durationSeconds = billableStart != null ? Math.floor((Date.now() - billableStart) / 1000) : 0;

    if (!sid) {
      // Billing skipped: sidRef and billingSidRef both empty (e.g. cleanup after hangup)
    } else if (billableStart == null) {
      // Billing skipped: AI never spoke (billableStart was never set)
    } else if (durationSeconds <= 0) {
      // Billing skipped: duration 0
    } else {
      const coinsToDeduct = durationSeconds; // 1 coin per second
      billingSidRef.current = null; // clear only after we use it for billing
      agoraVoiceCallBillingApi(sid, durationSeconds)
        .then((res) => {
          // API may return { data: { insufficient_coins_during_call } } or unwrapped { insufficient_coins_during_call }
          const data = res && typeof res === "object" && "data" in res ? (res as { data: { insufficient_coins_during_call?: boolean } }).data : res;
          const insufficient = data?.insufficient_coins_during_call ?? (res as { insufficient_coins_during_call?: boolean })?.insufficient_coins_during_call;
          if (insufficient) {
            toast.error("You ran out of coins during the call. Please top up to continue.");
          }
        })
        .catch((err) => {
          console.warn("[Voice Call] Billing request failed:", {
            status: err?.response?.status,
            data: err?.response?.data,
            message: err?.message,
          });
        });
    }

    if (cid && onHangup) {
      try {
        onHangup(cid, segmentsForApi);
      } catch {
        // ignore
      }
    }
  }, [onHangup]);

  // Get available audio devices
  const getAudioDevices = useCallback(async (): Promise<AudioDeviceInfo[]> => {
    try {
      const devices = await AgoraRTC.getDevices(true);
      return devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.substring(0, 8)}`,
        }));
    } catch (err) {
      console.error("Failed to get audio devices:", err);
      return [];
    }
  }, []);

  // Test microphone by checking volume level
  const testMicrophone = useCallback(
    async (deviceId?: string): Promise<{ success: boolean; maxVolume: number; details: any }> => {
      // Clean up any existing test track
      if (testTrackRef.current) {
        try {
          testTrackRef.current.close();
        } catch {
          // ignore
        }
        testTrackRef.current = null;
      }

      try {
        // Create test track with specified device
        const testTrack = await AgoraRTC.createMicrophoneAudioTrack({
          microphoneId: deviceId,
        });
        testTrackRef.current = testTrack;

        // Enable the track
        await testTrack.setEnabled(true);
        if (testTrack.muted) {
          await testTrack.setMuted(false);
        }

        // Check media track state
        const mediaTrack = testTrack.getMediaStreamTrack();
        const trackState = {
          enabled: mediaTrack?.enabled ?? false,
          muted: testTrack.muted,
          readyState: mediaTrack?.readyState ?? 'unknown',
        };
        
        if (mediaTrack && !mediaTrack.enabled) {
          mediaTrack.enabled = true;
        }

        // Wait a bit for track to initialize
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check volume level multiple times over 3 seconds (increased from 2)
        let maxVolume = 0;
        const checkInterval = 200; // Check every 200ms
        const testDuration = 3000; // Test for 3 seconds
        const checks = testDuration / checkInterval;
        const volumeReadings: number[] = [];

        for (let i = 0; i < checks; i++) {
          const volume = testTrack.getVolumeLevel();
          volumeReadings.push(volume);
          if (volume > maxVolume) {
            maxVolume = volume;
          }
          await new Promise((resolve) => setTimeout(resolve, checkInterval));
        }

        const details = {
          maxVolume,
          avgVolume: volumeReadings.reduce((a, b) => a + b, 0) / volumeReadings.length,
          minVolume: Math.min(...volumeReadings),
          trackState,
          deviceId,
        };

        // Clean up test track
        testTrack.close();
        testTrackRef.current = null;

        // Volume > 0 means microphone is working
        const success = maxVolume > 0;
        return { success, maxVolume, details };
      } catch (err: any) {
        
        // Clean up on error
        if (testTrackRef.current) {
          try {
            testTrackRef.current.close();
          } catch {
            // ignore
          }
          testTrackRef.current = null;
        }

        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          throw new Error("麦克风权限被拒绝");
        } else if (err?.name === "NotFoundError") {
          throw new Error("未检测到麦克风设备");
        }
        throw err;
      }
    },
    []
  );

  const startListening = useCallback(
    async (sid: string) => {
      if (clientRef.current) return;

      setState("idle");
      setIsInitialized(false);
      sidRef.current = sid;
      billingSidRef.current = sid;
      billableStartTimeRef.current = null;

      try {
        let data;
        try {
          data = await getAgoraTokenApi(sid);
        } catch (tokenErr: any) {
          if (tokenErr?.response?.status === 402) {
            const msg = tokenErr?.response?.data?.message ?? "Need at least 60 coins to start a voice call.";
            toast.error(msg);
            throw tokenErr;
          }
          throw tokenErr;
        }
        // Backend returns agoraToken to avoid JWT signing conflict
        const token = data?.agoraToken;
        if (!token || !data?.appId) {
          throw new Error("Invalid token response");
        }
        const { appId, channel, uid, callId } = data;
        // Max billable seconds = balance at call start (1 coin/sec). Call will be cut off when reached.
        maxDurationSecondsRef.current =
          typeof data?.max_duration_seconds === "number" && data.max_duration_seconds > 0
            ? data.max_duration_seconds
            : null;

        // Validate App ID format before joining
        if (!appId || typeof appId !== 'string' || appId.length !== 32) {
          throw new Error(`Invalid App ID format: ${appId}. Expected 32-character hex string.`);
        }

        // Enable audio PTS metadata for word-level caption sync (ConvoAI real-time transcript)
        const rtcAny = AgoraRTC as { setParameter?: (key: string, value: unknown) => void };
        if (typeof rtcAny.setParameter === "function") {
          rtcAny.setParameter("ENABLE_AUDIO_PTS_METADATA", true);
        }

        const client = AgoraRTC.createClient({
          mode: "rtc",
          codec: "vp8",
          enableLogUpload: true,
        } as any);
        clientRef.current = client;
        channelNameRef.current = channel;
        callIdRef.current = typeof callId === "string" && callId ? callId : channel;

        // --- RTM: used only for real-time captions (transcript). If this block fails or no messages arrive, the voice call continues without captions. ---
        const clientUidStr = String(uid);
        clientUidStrRef.current = clientUidStr;
        try {
          const rtm = new RTM(appId, clientUidStr);
          rtmClientRef.current = rtm;

          await rtm.login({ token });
          await rtm.subscribe(channel, { withMessage: true, withPresence: false });

          rtm.addEventListener("message", (event: { message: string | Uint8Array; channelName?: string }) => {
            const raw = typeof event.message === "string" ? event.message : new TextDecoder().decode(event.message);
            let payload: unknown;
            try {
              payload = JSON.parse(raw);
            } catch {
              payload = raw;
            }
            const incoming = parseTranscriptMessage(payload);
            if (incoming.length > 0 && setSendingMessages) {
              accumulatedTranscriptsRef.current = mergeTranscriptsIntoAccumulated(
                accumulatedTranscriptsRef.current,
                incoming
              );
              mergeVoiceCaptionsIntoChat(
                setSendingMessages,
                accumulatedTranscriptsRef.current,
                clientUidStr,
                "999999"
              );
            }
          });
        } catch (rtmErr: unknown) {
          const errMsg = rtmErr instanceof Error ? rtmErr.message : String(rtmErr);
          const errStack = rtmErr instanceof Error ? rtmErr.stack : undefined;
          console.warn("[Voice Call] RTM init/subscribe failed (captions disabled)", { error: errMsg, stack: errStack, rtmErr });
          if (rtmClientRef.current) {
            rtmClientRef.current = null;
          }
        }
        // --- end RTM captions block ---

        // Handle user published (AI agent speaking) — start billing from first AI speech
        client.on("user-published", async (user, mediaType) => {
          if (user.uid === 999999 && mediaType === "audio") {
            try {
              await client.subscribe(user, "audio");
              if (user.audioTrack) {
                user.audioTrack.play();
                if (billableStartTimeRef.current == null) {
                  billableStartTimeRef.current = Date.now();
                  // Enforce max duration: disconnect when billable time reaches balance (1 coin/sec)
                  const maxSec = maxDurationSecondsRef.current;
                  if (typeof maxSec === "number" && maxSec > 0) {
                    maxDurationCheckIntervalRef.current = setInterval(() => {
                      const start = billableStartTimeRef.current;
                      if (start == null) return;
                      const elapsed = Math.floor((Date.now() - start) / 1000);
                      if (elapsed >= maxSec) {
                        if (maxDurationCheckIntervalRef.current) {
                          clearInterval(maxDurationCheckIntervalRef.current);
                          maxDurationCheckIntervalRef.current = null;
                        }
                        toast.info("You've used your available call time.");
                        stopListening();
                      }
                    }, 1000);
                  }
                }
                setState("ai_speaking");
              }
            } catch {
              // subscribe failed
            }
          }
        });

        // Handle user unpublished (AI agent stopped)
        client.on("user-unpublished", (user, mediaType) => {
          if (user.uid === 999999 && mediaType === "audio") {
            setState((prev) =>
              prev === "ai_speaking" ? "idle" : prev
            );
          }
        });

        // Handle user left (AI agent disconnected)
        client.on("user-left", (user) => {
          if (user.uid === 999999) {
            setState((prev) =>
              prev === "ai_speaking" ? "idle" : prev
            );
          }
        });

        // Handle connection state changes
        client.on("connection-state-change", (curState) => {
          if (curState === "DISCONNECTED" || curState === "DISCONNECTING") {
            stopListening();
          }
        });

        client.on("exception", (evt) => {
          if (evt.code === 701) return; // STUN/TURN timeout — ignore, often in strict networks
          if (evt.code === 2001) return; // AUDIO_INPUT_LEVEL_TOO_LOW — don't disconnect, no need to log every time
          if (evt.code === 1001 || evt.code === 1002) {
            stopListening();
            return;
          }
          console.warn("[Voice Call] Agora exception:", { code: evt.code, msg: evt.msg, uid: evt.uid });
        });

        // Get available audio devices and test microphone before joining
        const audioDevices = await getAudioDevices();
        if (audioDevices.length === 0) {
          throw new Error("未检测到麦克风设备");
        }

        // Test microphone with first available device (or let browser choose default)
        const testResult = await testMicrophone();
        if (!testResult.success) {
          // Don't throw - allow user to proceed, but warn them
        }

        // Create track for actual use (browser will use default or we can specify deviceId)
        const localTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = localTrack;

        await client.join(appId, channel, token, uid);
        setIsInitialized(true);
        setState("idle");

        // If agent already has audio track, subscribe to it — start billing from first AI speech
        const remoteUsers = client.remoteUsers;
        remoteUsers.forEach((user) => {
          if (user.uid === 999999 && user.hasAudio && !user.audioTrack) {
            client.subscribe(user, "audio").then(() => {
              if (user.audioTrack) {
                user.audioTrack.play();
                if (billableStartTimeRef.current == null) {
                  billableStartTimeRef.current = Date.now();
                }
                setState("ai_speaking");
              }
            }).catch(() => {});
          }
        });

        localTrack.on("track-ended", () => {
          stopListening();
        });

        const mediaTrack = localTrack.getMediaStreamTrack();
        if (mediaTrack && !mediaTrack.enabled) {
          mediaTrack.enabled = true;
        }
        await localTrack.setEnabled(true);
        if (localTrack.muted) {
          await localTrack.setMuted(false);
        }

        await client.publish([localTrack]);

        const mtAfterPublish = localTrack.getMediaStreamTrack();
        if (mtAfterPublish && !mtAfterPublish.enabled) {
          mtAfterPublish.enabled = true;
        }
        if (localTrack.muted) {
          await localTrack.setMuted(false);
        }

        setState("idle");
      } catch (err: any) {
        if (err?.response?.status === 402) {
          throw err;
        }
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          alert("麦克风权限被拒绝\n\n请在浏览器设置中允许麦克风访问");
        } else if (err?.name === "NotFoundError") {
          alert("未检测到麦克风设备");
        }
        stopListening();
        throw err;
      }
    },
    [stopListening, getAudioDevices, testMicrophone]
  );

  const toggleVoiceEnabled = useCallback(() => {
    const track = localAudioTrackRef.current;
    const current = getIsVoiceEnabled();
    setIsVoiceEnabled(!current);

    if (track) {
      if (current) {
        track.setEnabled(false);
      } else {
        track.setEnabled(true);
      }
    }
  }, [getIsVoiceEnabled, setIsVoiceEnabled]);

  return {
    state,
    isInitialized,
    getIsInitialized,
    startListening,
    stopListening,
    callIdRef,
    isVoiceEnabled,
    toggleVoiceEnabled,
    getAudioDevices,
    testMicrophone,
  };
}
