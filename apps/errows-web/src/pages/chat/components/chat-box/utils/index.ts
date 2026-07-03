import { type SendingMessage } from "@/pages/chat/hooks";
export const isSessionMessage = (
  message: API.SESSION.SESSION_MESSAGE | API.SESSION.MESSAGE_REPLY
): message is API.SESSION.SESSION_MESSAGE => {
  return message && "id" in message;
};

export const isMessageReply = (
  message: API.SESSION.SESSION_MESSAGE | SendingMessage['reply']
): message is SendingMessage['reply'] => {
  return !!(message && "reply_message_id" in message);
};

export const formatMessage = (message: string) => {
  const result: { type: string; data: string }[] = [];
  const byStar = message?.split("*") ?? [];

  for (let i = 0; i < byStar.length; i++) {
    const segment = byStar[i] ?? "";

    // Odd-indexed segments are actions (*...*)
    if (i % 2 === 1) {
      if (segment.length > 0) {
        result.push({ type: "action", data: segment });
      }
      continue;
    }

    // Even-indexed segments: check for speech ("...")
    const byQuote = segment.split('"');
    for (let k = 0; k < byQuote.length; k++) {
      const s = byQuote[k] ?? "";
      if (s.length === 0) continue;

      if (k % 2 === 1) {
        result.push({ type: "speech", data: s });
      } else {
        result.push({ type: "text", data: s });
      }
    }
  }

  return result;
};
