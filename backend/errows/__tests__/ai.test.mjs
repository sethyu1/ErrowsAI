import { describe, expect, onTestFailed, test } from 'vitest';
import ai from '@errows/ai';
import { mockAIImageServer } from './fixtures/ai.mjs';
import character_options from '../static/character_creation.json';

const character_setting_1 = {
  nickname: 'TestCharacter',
  introduction: 'This is a test character introduction.',
  gender: 'Female',
  type: 'Anime',
  assortment: 'Human',
  race: "Caucasian",
  age: 'Teen(18+)',

  voice: 'vo1',
  eye_color: 'Green',
  hair_style: 'Medium ponytail',
  hair_length: 'Short hair',
  hair_bangs: 'Choppy bangs',
  hair_color: 'Black',
  body_type: 'Petite',
  breast_size: 'Flat',
  butt_size: 'Small',
  tags: ['warrior', 'brave', 'loyal'],

  settings: 'A brave warrior from a distant land.',
  greeting: 'Hello, traveler! Welcome to our village.',
  personality: 'Courageous, loyal, and kind-hearted.',
  scenario: 'Defending the village from invaders.',
  conversation: [
    {
      user: 'Can you tell me about your village?',
      character: 'Our village is small but full of brave souls ready to defend it.'
    },
    {
      user: 'What motivates you to fight?',
      character: 'Protecting my people and upholding justice drives me forward.'
    }
  ]
};

describe('ai images', () => {
  const avatar_url = '/mock-ai-image.png';
  const apiKey = 'mock-api-key';
  const baseUrl = 'https://mock-base-url.com';

  describe('basic', () => {
    test('generate character image', async () => {
      const { endpoint, resolveRequest, apiRequest, close } = await mockAIImageServer();
      onTestFailed(() => close());
      resolveRequest({ image_url: avatar_url });

      const serviceSettings = { endpoint, apiKey, baseUrl };
      const image = await ai.avatarGen(
        serviceSettings,
        character_options,
        character_setting_1
      );

      expect(apiRequest).toHaveBeenCalledTimes(1);
      expect(image).toHaveProperty('image_url', avatar_url);
      const args = apiRequest.mock.calls[0][0];
      expect(args).toHaveProperty('key', apiKey);
      expect(args).toMatchSnapshot();
      await close();
    });

    test(
      'throw error on image generation failure',
      async () => {
        const { endpoint, resolveRequest, apiRequest, close } = await mockAIImageServer();
        onTestFailed(() => close());
        resolveRequest({ image_url: null });
        const serviceSettings = { endpoint, apiKey, baseUrl };
        await expect(ai.avatarGen(
          serviceSettings,
          character_options,
          character_setting_1
        )).rejects.toBeTruthy();
        expect(apiRequest).toHaveBeenCalledTimes(1);
        await close();
      }
    );
  });

  describe('specify style for image generation', () => {
    test('dragon', async () => {
      const { endpoint, resolveRequest, apiRequest, close } = await mockAIImageServer();
      onTestFailed(() => close());
      resolveRequest({ image_url: avatar_url });

      const serviceSettings = { endpoint, apiKey, baseUrl };
      const character_setting_with_style = {
        ...character_setting_1,
        assortment: 'Dragon',
        race: 'Black Dragon'
      };

      const image = await ai.avatarGen(
        serviceSettings,
        character_options,
        character_setting_with_style
      );

      expect(apiRequest).toHaveBeenCalledTimes(1);
      expect(image).toHaveProperty('image_url', avatar_url);
      const args = apiRequest.mock.calls[0][0];
      expect(args).toHaveProperty('key', apiKey);
      expect(args).toMatchSnapshot();
      await close();
    });
  });
});
