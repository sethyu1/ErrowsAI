import { request } from "@/apis/request";
import { useAuthStore } from "@/stores/auth";
import { formatToken } from "@/utils";

const isCapacitor =
  typeof window !== "undefined" &&
  (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.();

const API_BASE_URL = isCapacitor ? "https://api.example.com/api" : "/api";

export interface StreamMessageEvent {
  type: "start" | "chunk" | "done" | "error" | "end" | "image_generating" | "image_done" | "image_failed";
  data: unknown;
}

export async function* sendMessageStreamApi(
  sid: string,
  content: string
): AsyncGenerator<StreamMessageEvent> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}/my/sessions/${sid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: formatToken(token || ""),
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    yield { type: "error", data: { message: `HTTP error: ${response.status}` } };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: "error", data: { message: "No response body" } };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const eventText of events) {
        if (!eventText.trim()) continue;

        const lines = eventText.split("\n");
        let eventType = "";
        let eventData = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ")) {
            eventData = line.slice(6);
          }
        }

        if (eventType) {
          let parsedData: unknown = eventData;
          try {
            if (eventData) {
              parsedData = JSON.parse(eventData);
            }
          } catch {
            parsedData = eventData;
          }
          yield { type: eventType as StreamMessageEvent["type"], data: parsedData };
        }
      }
    }

    if (buffer.trim()) {
      const lines = buffer.split("\n");
      let eventType = "";
      let eventData = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7);
        } else if (line.startsWith("data: ")) {
          eventData = line.slice(6);
        }
      }

      if (eventType) {
        let parsedData: unknown = eventData;
        try {
          if (eventData) {
            parsedData = JSON.parse(eventData);
          }
        } catch {
          parsedData = eventData;
        }
        yield { type: eventType as StreamMessageEvent["type"], data: parsedData };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const sendMessageApi = async (
  sid: string,
  requestId: string,
  content: string
) => {
  const res = await request.post(`/my/sessions/${sid}`, { content });
  return {
    ...res,
    requestId,
  };
};

export const feedbackMessageApi = (
  sid: string,
  mid: string,
  feedback: "like" | "dislike"
) => {
  return request.post(
    `/my/sessions/${sid}/messages/${mid}/feedback/${feedback}`
  );
};

export const suggestMessageApi = (sid: string) => {
  return request.get(`/my/sessions/${sid}/messages/suggest`);
};

export const deleteMessageApi = (sid: string, mid: string) => {
  return request.delete(`/my/sessions/${sid}/messages/${mid}`);
};


export const editMessageApi = (sid: string, mid: string, content: string) => {
  return request.put(`/my/sessions/${sid}/messages/${mid}`, { content });
};

export const applyImageApi = (sid: string) => {
  return request.post(`/my/sessions/${sid}/messages/character/images`);
};

/**
 * 消息转语音
 */
export const getTtsApi = (sid: string, mid: string) => {
  return request.post(`/my/sessions/${sid}/messages/${mid}/tts`);
};

/*
拨号接口 (legacy HTTP voice call - commented in favor of Agora)
*/

export const callApi = (sid: string) => {
  return request.post(`/my/sessions/${sid}/call`);
};

/**
 * Agora RTC token for voice call (声网 SDK)
 * Returns 402 when user has fewer than 60 coins (need to handle in UI).
 */
export const getAgoraTokenApi = (
  sid: string,
  params?: { channel?: string; uid?: number }
) => {
  return request.get<{
    agoraToken: string;
    appId: string;
    channel: string;
    uid: number;
    /** Voice call UUID for hangup (POST .../call/:cid/hangup). Use this as callId, not channel. */
    callId: string;
    /** Max billable seconds (balance at token time). Call must not exceed this; client disconnects when reached. */
    max_duration_seconds?: number;
  }>(`/my/sessions/${sid}/voice/agora-token`, { params });
};

/**
 * Agora voice call billing: report billable duration (seconds from when AI started talking).
 * Returns { insufficient_coins_during_call: true } when user ran out of coins during the call.
 */
export const agoraVoiceCallBillingApi = (
  sid: string,
  duration_seconds: number
) => {
  const url = `/my/sessions/${sid}/voice/billing`;
  return request.post<{ insufficient_coins_during_call?: boolean }>(url, {
    duration_seconds,
  });
};

/*
实时语音聊天，SSE

*/
export const chattingApi = async (sid: string, callId:string, body: any) => {
  return request.post(`/my/sessions/${sid}/call/${callId}/voice`, body);
};

/*
挂断。Optional body.segments saves voice captions for the call.
*/
export const hangupApi = (
  sid: string,
  callId: string,
  body?: { segments?: { transcript_user: string; transcript_character: string[] }[] }
) => {
  return request.post(`/my/sessions/${sid}/call/${callId}/hangup`, body ?? {});
};

/**
 * 赠送礼物
 */
export const sendGiftApi = (sid: string, giftId: string) => {
  return request.post(`/my/sessions/${sid}/gifts/${giftId}`);
};