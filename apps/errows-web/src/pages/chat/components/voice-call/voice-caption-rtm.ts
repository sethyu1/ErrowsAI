/**
 * Voice call real-time captions via Agora RTM.
 * Parses ConvoAI transcript channel messages and maps them to chat SendingMessage shape.
 */

import type { SendingMessage } from "../../hooks";
import { v4 as uuidv4 } from "uuid";

const VOICE_CAPTION_PREFIX = "voice-";
const AGENT_UID_STR = "999999";

function hasRealContent(text: string): boolean {
  return Boolean(text && text.trim().length > 0);
}

/** ConvoAI: turn_status 0 = in progress, 1 = completed (full sentence), 2 = interrupted. Only display/save when full. */
function isFullSentence(t: TranscriptItem): boolean {
  if ((t as TranscriptItem & { isFullSentence?: boolean }).isFullSentence === true) return true;
  return t.status === 1 || t.status === 2;
}

export interface TranscriptItem {
  uid: string;
  text: string;
  /** 0=in progress, 1=completed (full sentence), 2=interrupted. From ConvoAI turn_status. */
  status?: number;
  turn_id?: number;
  stream_id?: number;
  _time?: number;
  /** ConvoAI payload: "assistant.transcription" (agent/left) or "user.transcription" (user/right) */
  objectType?: string;
  /** Optional: explicit full-sentence flag from payload (e.g. is_final, stable) */
  isFullSentence?: boolean;
}

/**
 * Parse RTM channel message payload from ConvoAI into transcript items.
 * Accepts full list (array) or single item; normalizes to array.
 */
export function parseTranscriptMessage(message: unknown): TranscriptItem[] {
  if (message == null) return [];
  let list: unknown[] = [];
  if (Array.isArray(message)) {
    list = message;
  } else if (typeof message === "object" && "data" in (message as object)) {
    const d = (message as { data: unknown }).data;
    list = Array.isArray(d) ? d : [d];
  } else if (typeof message === "object" && "transcripts" in (message as object)) {
    const t = (message as { transcripts: unknown }).transcripts;
    list = Array.isArray(t) ? t : [t];
  } else if (typeof message === "string") {
    try {
      const parsed = JSON.parse(message) as unknown;
      return parseTranscriptMessage(parsed);
    } catch {
      return [];
    }
  } else {
    list = [message];
  }
  const result = list
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => ({
      uid: String(item.uid ?? item.userId ?? item.user_id ?? ""),
      text: String(item.text ?? item.content ?? "").trim(),
      status: typeof item.status === "number" ? item.status : (typeof (item as { turn_status?: number }).turn_status === "number" ? (item as { turn_status: number }).turn_status : undefined),
      turn_id: typeof item.turn_id === "number" ? item.turn_id : typeof item.turnId === "number" ? item.turnId : undefined,
      stream_id: typeof item.stream_id === "number" ? item.stream_id : undefined,
      _time: typeof item._time === "number" ? item._time : typeof (item as { start_ms?: number }).start_ms === "number" ? (item as { start_ms: number }).start_ms : undefined,
      objectType: typeof item.object === "string" ? item.object : undefined,
      isFullSentence:
        typeof (item as { is_final?: boolean }).is_final === "boolean"
          ? (item as { is_final: boolean }).is_final
          : (item as { is_final?: unknown }).is_final !== undefined
            ? Boolean((item as { is_final: unknown }).is_final)
            : undefined,
    }))
    .filter((t) => t.uid || t.text || t.objectType);
  return result;
}

/**
 * Determine if a transcript segment is from the user (vs AI agent) for chat layout.
 * ConvoAI uses objectType: "user.transcription" (user, right) vs "assistant.transcription" (agent, left).
 * Also support uid/role/speaker for other payload shapes.
 */
function isUserSegment(t: TranscriptItem, clientUidStr: string, agentUidStr: string): boolean {
  const obj = (t as TranscriptItem & { objectType?: string }).objectType ?? "";
  if (typeof obj === "string") {
    const lower = obj.toLowerCase();
    if (lower.includes("user") || lower === "asr.transcription") return true;
    if (lower.includes("assistant") || lower.includes("agent")) return false;
  }
  const uid = String(t.uid ?? "");
  if (uid === clientUidStr) return true;
  if (uid === agentUidStr) return false;
  const anyT = t as TranscriptItem & { role?: string; speaker?: string; isUser?: boolean };
  if (anyT.role === "user" || anyT.speaker === "user" || anyT.isUser === true) return true;
  if (anyT.role === "agent" || anyT.role === "character" || anyT.speaker === "agent") return false;
  return false;
}

/**
 * Map transcript items to SendingMessage[] (user + reply pairs) for main chat.
 * One user caption – one AI caption per pair. Consecutive user segments are merged into one user bubble.
 * Chat box: role "user" => justify-end (right), reply => justify-start (left).
 */
export function mapTranscriptsToSendingMessages(
  transcripts: TranscriptItem[],
  clientUidStr: string,
  agentUidStr: string = AGENT_UID_STR
): SendingMessage[] {
  const sorted = [...transcripts].sort((a, b) => {
    const ta = a.turn_id ?? 0;
    const tb = b.turn_id ?? 0;
    if (ta !== tb) return ta - tb;
    const tma = a._time ?? 0;
    const tmb = b._time ?? 0;
    if (tma !== tmb) return tma - tmb;
    const aUser = isUserSegment(a, clientUidStr, agentUidStr) ? 0 : 1;
    const bUser = isUserSegment(b, clientUidStr, agentUidStr) ? 0 : 1;
    return aUser - bUser;
  });
  const result: SendingMessage[] = [];
  let currentUser = "";
  let currentCharacter = "";
  let characterEnded = false;
  let pairIndex = 0;

  const pushPair = (userText: string, characterText: string, replyStatus: "loading" | "success") => {
    const now = new Date().toISOString();
    const base = {
      sended_at: now,
      id: uuidv4(),
      reply_to_id: "",
      voice_url: null,
      image_url: null,
      edited_at: now,
      feedback: null,
    };
    const requestId = `${VOICE_CAPTION_PREFIX}${pairIndex}-u`;
    result.push({
      requestId,
      content: userText,
      type: "text",
      status: "success",
      role: "user",
      ...base,
      reply: {
        ...base,
        requestId,
        content: characterText,
        status: replyStatus,
        role: "character",
        type: "text",
        reply_picture_url: null,
        reply_voice_url: null,
        send_voice_url: null,
        send_message_id: "",
        reply_message_id: "",
      },
    });
    pairIndex += 1;
  };

  for (const t of sorted) {
    if (!hasRealContent(t.text)) continue;
    const isUser = isUserSegment(t, clientUidStr, agentUidStr);
    const text = t.text.trim();
    const ended = isFullSentence(t);

    if (isUser) {
      if (hasRealContent(currentCharacter)) {
        pushPair(currentUser, currentCharacter, characterEnded ? "success" : "loading");
        currentUser = text;
        currentCharacter = "";
        characterEnded = false;
      } else {
        currentUser = currentUser ? `${currentUser} ${text}` : text;
      }
    } else {
      currentCharacter = currentCharacter ? `${currentCharacter} ${text}` : text;
      characterEnded = characterEnded || ended;
    }
  }
  if (hasRealContent(currentUser) || hasRealContent(currentCharacter)) {
    pushPair(currentUser, currentCharacter, characterEnded ? "success" : "loading");
  }
  return result;
}

/**
 * Merge incoming transcript segments into an accumulated list.
 * Segments with the same (turn_id, uid, objectType) are updated (text and status); new segments are appended.
 * objectType in the key keeps user.transcription and assistant.transcription for the same turn separate.
 */
export function mergeTranscriptsIntoAccumulated(
  accumulated: TranscriptItem[],
  incoming: TranscriptItem[]
): TranscriptItem[] {
  if (incoming.length === 0) return accumulated;
  const mergeKey = (t: TranscriptItem) => `${t.turn_id ?? t._time ?? ""}-${t.uid}-${t.objectType ?? ""}`;
  const byKey = new Map<string, TranscriptItem>();
  for (const t of accumulated) {
    byKey.set(mergeKey(t), { ...t });
  }
  for (const t of incoming) {
    const key = mergeKey(t);
    const existing = byKey.get(key);
    if (existing) {
      existing.text = t.text ?? existing.text;
      if (t.status !== undefined) existing.status = t.status;
      if (t._time !== undefined) existing._time = t._time;
    } else {
      byKey.set(key, { ...t });
    }
  }
  return [...byKey.values()].sort((a, b) => (a._time ?? 0) - (b._time ?? 0) || (a.turn_id ?? 0) - (b.turn_id ?? 0));
}

/**
 * Convert accumulated transcripts to segments for API persistence.
 * Output is strictly one user caption – one AI caption per segment.
 * Multiple consecutive user segments are merged into a single user caption; then one AI segment (full-sentence) produces one segment.
 */
export function transcriptsToSegments(
  transcripts: TranscriptItem[],
  clientUidStr: string,
  agentUidStr: string = AGENT_UID_STR
): { transcript_user: string; transcript_character: string[] }[] {
  const sorted = [...transcripts].sort((a, b) => {
    const ta = a.turn_id ?? 0;
    const tb = b.turn_id ?? 0;
    if (ta !== tb) return ta - tb;
    const tma = a._time ?? 0;
    const tmb = b._time ?? 0;
    if (tma !== tmb) return tma - tmb;
    const aUser = isUserSegment(a, clientUidStr, agentUidStr) ? 0 : 1;
    const bUser = isUserSegment(b, clientUidStr, agentUidStr) ? 0 : 1;
    return aUser - bUser;
  });
  const segments: { transcript_user: string; transcript_character: string[] }[] = [];
  let currentUser = "";
  for (const t of sorted) {
    const isUser = isUserSegment(t, clientUidStr, agentUidStr);
    const text = (t.text && t.text.trim()) ? t.text.trim() : "";
    if (isUser) {
      if (hasRealContent(text)) {
        currentUser = currentUser ? `${currentUser} ${text}` : text;
      }
      continue;
    }
    // Character segment: only persist when full sentence; persist speech-only (asterisks stripped)
    if (!isFullSentence(t)) continue;
    if (hasRealContent(currentUser) || hasRealContent(text)) {
      segments.push({
        transcript_user: currentUser,
        transcript_character: hasRealContent(text) ? [text] : [],
      });
    }
    currentUser = "";
  }
  if (hasRealContent(currentUser)) {
    segments.push({
      transcript_user: currentUser,
      transcript_character: [],
    });
  }
  return segments;
}

/**
 * Merge voice caption messages into chat: replace all voice-* entries with new list.
 */
export function mergeVoiceCaptionsIntoChat(
  setSendingMessages: React.Dispatch<React.SetStateAction<SendingMessage[]>>,
  transcripts: TranscriptItem[],
  clientUidStr: string,
  agentUidStr: string = AGENT_UID_STR
): void {
  const voiceMessages = mapTranscriptsToSendingMessages(transcripts, clientUidStr, agentUidStr);
  setSendingMessages((prev) => [
    ...prev.filter((m) => !String(m.requestId).startsWith(VOICE_CAPTION_PREFIX)),
    ...voiceMessages,
  ]);
}
