/**
 * In-memory store for LLM request payloads (chat + voice) for console debug.
 * No database; cleared on process restart.
 */
const MAX = 50;
const chatPayloads = [];
const voicePayloads = [];
const imagePayloads = [];
const videoPayloads = [];

export function pushChat(entry) {
  chatPayloads.unshift(entry);
  if (chatPayloads.length > MAX) chatPayloads.length = MAX;
}

export function pushVoice(entry) {
  voicePayloads.unshift(entry);
  if (voicePayloads.length > MAX) voicePayloads.length = MAX;
}

export function pushImage(entry) {
  imagePayloads.unshift(entry);
  if (imagePayloads.length > MAX) imagePayloads.length = MAX;
}

export function pushVideo(entry) {
  videoPayloads.unshift(entry);
  if (videoPayloads.length > MAX) videoPayloads.length = MAX;
}

export function getPayloads() {
  return {
    chat: [...chatPayloads],
    voice: [...voicePayloads],
    image: [...imagePayloads],
    video: [...videoPayloads]
  };
}
