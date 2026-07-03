/**
 * Character-creation refine: use a system prompt + user text to get refined output.
 * Used when creating a new character (Character Setting / Greeting), not in chat or session.
 * Calls OpenAI-compatible chat completions API (endpoint + api_key from config).
 */

import { postJSON } from './json';
import { pushLLMDebugPayload } from './debug-sink';

interface RefineConfig {
  endpoint: string;
  api_key?: string;
  apiKey?: string;
  model?: string;
  max_token?: number;
}

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Refine user text using a system prompt. Calls OpenAI-compatible chat completions API.
 * Body: { model, messages: [{ role: "system", content }, { role: "user", content }], max_tokens }
 */
export async function refineTextCompletion(
  config: RefineConfig,
  systemPrompt: string,
  userText: string,
): Promise<{ reply: string }> {
  const { endpoint, model = 'grok-4-1-fast-non-reasoning', max_token = 500 } = config;
  const apiKey = config.api_key ?? config.apiKey ?? '';

  const body = {
    model,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userText },
    ],
    max_tokens: max_token,
  };

  pushLLMDebugPayload('refine_text', body);

  // eslint-disable-next-line no-console
  console.log('[refine] Request to Grok:', JSON.stringify(body, null, 2));

  try {
    const res = await postJSON<OpenAIChatResponse>(endpoint, {
      body,
      token: apiKey,
    });
    const reply = res?.choices?.[0]?.message?.content ?? '';
    return { reply };
  } catch (err) {
    const cause = err instanceof Error ? err.cause : undefined;
    // eslint-disable-next-line no-console
    console.error('[refine] Grok API failed:', err instanceof Error ? err.message : err);
    // eslint-disable-next-line no-console
    console.error('[refine] Cause:', cause);
    throw err;
  }
}
