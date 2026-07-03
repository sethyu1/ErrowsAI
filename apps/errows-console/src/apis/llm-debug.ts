import { request } from '@/apis/request';

export interface LLMDebugEntry {
  at: string;
  type: string;
  payload: unknown;
  /** Optional context (e.g. Agora: sid, uid, character_id, character_name, channel) */
  sid?: string;
  uid?: string | number;
  character_id?: string;
  character_name?: string;
  channel?: string;
}

export interface LLMDebugPayloads {
  chat: LLMDebugEntry[];
  voice: LLMDebugEntry[];
  image: LLMDebugEntry[];
  video: LLMDebugEntry[];
}

export function getLLMDebugPayloadsApi() {
  return request.get<LLMDebugPayloads>('/ops/llm-debug/payloads');
}
