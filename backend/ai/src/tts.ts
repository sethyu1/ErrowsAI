import Stream, { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import { fetch, Response } from 'undici';
import FormData from "form-data";
import { CHARACTER_SETTING } from "@errows/types";
import split2 from 'split2';
import { pushLLMDebugPayload } from './debug-sink';

export async function tts(
  config: { endpoint: string },
  character_settings: CHARACTER_SETTING,
  text: string
): Promise<{ voice_url: string }> {
  const { endpoint } = config;
  const { nickname, voice = '' } = character_settings;

  const voiceId = typeof voice === 'string'
    ? voice.replace(/\+/g, ' ').replace(/\.mp3$/i, '')
    : '';
  const body = {
    character_setting: { voice_id: voiceId },
    response: text
  };

  pushLLMDebugPayload('tts', body);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const voice_url = await res.text();
  if (res.ok === false) {
    throw new Error(voice_url ?? 'Text to speech generation failed.');
  }

  return { voice_url };
}

export type VOICE_CALL_EVENT =
| { event: 'tts_sentence'; data: { text: string; wav_base64: string } }
| { event: 'error'; data: { message: string } }
| { event: 'stt', data: { text: string } }
;

export async function* voiceCall(
  config: { endpoint: string },
  character_settings: CHARACTER_SETTING,
  audio_stream: Stream.Readable
): AsyncGenerator<VOICE_CALL_EVENT> {
  const { endpoint } = config;
  const { nickname, voice = '' } = character_settings;

  const voiceId = typeof voice === 'string'
    ? voice.replace(/\+/g, ' ').replace(/\.mp3$/i, '')
    : '';

  pushLLMDebugPayload('voice_call', { character_setting: { voice_id: voiceId }, endpoint });

  const form = new FormData();
  form.append('audio', audio_stream, 'audio.wav');
  form.append('character_setting[voice_id]', voiceId);
  const passthrough = new Stream.Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk);
    }
  });
  form.pipe(passthrough);
  form.on('error', (err) => {
    passthrough.destroy(err);
  });
  const bodyStream = ReadableStream.from(passthrough);
  const headers = form.getHeaders();

  const res = await fetch(
    endpoint,
    { method: 'POST', headers, duplex: 'half', body: bodyStream }
  );

  if (res.ok === false) {
    const error_text = await res.text();
    throw new Error(error_text || 'Voice call failed.');
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('x-ndjson')) {
    const error_text = await res.text();
    throw new Error(error_text || 'Invalid response content type.');
  }

  for await (const item of parseResponseStream(res)) {
    const { event_type, data } = item;
    yield { event: event_type, data } as VOICE_CALL_EVENT;
  }
}

async function* parseResponseStream(
  res: Response
): AsyncGenerator<{ event_type: string; data: unknown }> {
  if (res.body == null) {
    throw new Error('Response body is null.');
  }

  const stream = Readable.fromWeb(res.body)
  .pipe(split2(JSON.parse) as any);

  for await (const chunk of stream) {
    yield chunk;
  }
}