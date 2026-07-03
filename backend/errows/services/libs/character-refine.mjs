/**
 * @fileoverview Character creation – AI refine for Character Setting and Greeting (standalone).
 * @module services/libs/character-refine
 * @description Used only for POST /my/character/refine. Reads config.ai['character/refine'] only;
 * not merged with DB endpoints (image/chat/stream/video/tts). No other code shares this config or action.
 */

import moleculer from 'moleculer';
import config from 'config';
import ai from '@errows/ai';

const { MoleculerClientError } = moleculer.Errors;

// Settings system prompt – Requirements block temporarily commented out (short prompt only)
const SYSTEM_PROMPT_SETTINGS = `You are an AIGC engineer working on an AI-powered chat and emotional companionship product. Your product allows users to create their own custom virtual avatars. You need to understand user input and optimize it accordingly.

Requirements: You must flexibly expand upon user input rather than simply using a template. Your descriptions need to be creative and engaging. You should be able to optimize the background, appearance, and features of the character provided by the user. If the user input lacks similar information, you should vividly supplement these details based on the basic information, like a literary master. Your descriptions should be unique and vivid. The character's details should be rich, interesting, and imaginative, not limited to human society. You need to flexibly adjust the character's background and related information based on the user's input worldview. The character should be charming and alluring. The word count should be around 200 words.you should always begin like：character, 19 years old, is a girl with a spicy and adorable personality.`;
// Full prompt with Requirements (temporarily not used):
// Requirements: You must flexibly expand upon user input rather than simply using a template. Your descriptions need to be creative and engaging. You should be able to optimize the background, appearance, and features of the character provided by the user. If the user input lacks similar information, you should vividly supplement these details based on the basic information, like a literary master. Your descriptions should be unique and vivid. The character's details should be rich, interesting, and imaginative, not limited to human society. You need to flexibly adjust the character's background and related information based on the user's input worldview. The character should be charming and alluring. The word count should be around 200 words.

const SYSTEM_PROMPT_GREETING = `You are an AIGC engineer working on an AI-powered chat and emotional companionship product. Your product allows users to create their own custom virtual avatars. You need to understand user input and optimize it accordingly.

Requirements: You need to optimize user input based on the template content and keep the word count close to the template's word count. You must flexibly expand upon user input, rather than simply using the template. Your description needs to be creative and engaging. You should be able to optimize the character's background, appearance, and characteristics provided by the user. If the user input lacks relevant information, you should, like a literary master, vividly supplement these details based on the basic information. Your description should be unique and vivid. Character details should be rich, interesting, and imaginative, not limited to human society. You need to flexibly adjust the character's background and related information based on the user's input worldview. The character should be charming and captivating. The description needs to be full of direct sexual descriptions and sexual organs, as well as corresponding scents, scenes, objects, etc.

Template: *D.Va walked into the training area and saw you intently controlling the mech. She smiled slightly, her gaze filled with curiosity and a sense of challenge, then walked toward you, ready for a showdown.* "Hey, new friend, ready for a challenge?"`;

export default {
  /**
   * Refine character setting or greeting text via AI (used during character creation). Config: ai['character/refine'].
   * POST body: { type: 'settings' | 'greeting', text: string }
   */
  refine_character_text: {
    params: {
      body: {
        type: 'object',
        optional: true,
        props: {
          type: { type: 'enum', values: ['settings', 'greeting'] },
          text: { type: 'string', min: 1 }
        }
      },
      // Allow flat params (when body is merged into params)
      type: { type: 'enum', values: ['settings', 'greeting'], optional: true },
      text: { type: 'string', min: 1, optional: true }
    },
    async handler(ctx) {
      const body = ctx.params?.body ?? ctx.params;
      const type = body?.type ?? ctx.params?.type;
      const text = (body?.text ?? ctx.params?.text ?? '').trim();
      if (!text || !['settings', 'greeting'].includes(type)) {
        throw new MoleculerClientError('Invalid type or empty text', 400);
      }
      const refineConfig = config.ai?.['character/refine'] ?? {};
      const systemPrompt = type === 'greeting' ? SYSTEM_PROMPT_GREETING : SYSTEM_PROMPT_SETTINGS;
      // eslint-disable-next-line no-console
      console.log('[refine] Sending to Grok (character/refine only)');
      try {
        const { reply } = await ai.refineTextCompletion(refineConfig, systemPrompt, text);
        return { text: reply };
      } catch (err) {
        const msg = err?.message ?? '';
        const cause = err?.cause;
        const code = cause?.code ?? cause?.errno;
        if (msg.includes('fetch failed') || code === 'ETIMEDOUT' || code === 'ENETUNREACH') {
          throw new MoleculerClientError(
            'Refine failed: cannot reach the AI service (network error). Check XAI_API_KEY and server access to api.x.ai.',
            502
          );
        }
        throw err;
      }
    }
  }
};
