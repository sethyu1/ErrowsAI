import { expect, vi } from 'vitest';
import { deleteJSON, getJSON, postJSON, putJSON } from "../lib/api.mjs";
import { random_value, random_text, waitingExpectToBeTrue } from '../lib/utils.mjs';
import { test as baseTest } from './payment.mjs';
import ai from '@errows/ai';
import _ from 'lodash';

export function getCharacterSetting(server, cid, token) {
  return getJSON(
    server,
    `/my/characters/${cid}/settings`,
    { token }
  );
}

export async function listCharacters(server, query = {}, token = null) {
  const list_query = Object.assign({ page: 0, size: 10 }, query);
  return getJSON( server, '/characters', { query: list_query, token });
}

export async function listMyCharacters(server, token, type, query = {}) {
  const list_query = Object.assign({ page: 0, size: 10 }, query);
  return getJSON(
    server,
    `/my/characters/${type}`,
    { token, query: list_query }
  );
}

export async function getCharacter(server, cid, token) {
  return getJSON( server, `/characters/${cid}`, { token });
}

export async function createCharacter(server, token, character_setting) {
  const character = await postJSON(
    server,
    `/my/characters`,
    { body: character_setting, token },
  );

  return character;
}

export async function createCharacterWithAvatar(
  server, token, character_setting
) {
  const character = await createRandomCharacter(server, token, character_setting);
  return waitingExpectToBeTrue(
    () => getCharacter(server, character.id, token),
    (character) => {
      expect(character).toHaveProperty('status', 'private');
    }
  );
}

export async function deleteCharacter(server, token, cid) {
  return deleteJSON( server, `/my/characters/${cid}`, { token });
}

async function getCharacterOptions(server) {
  return getJSON(
    server,
    `/characters/options`
  );
}

export function random_gen_character_setting(options, overrides = {}) {
  const settings = options.reduce(
    (acc, { key, input_type, options, max_select, depends }) => {
      let value = overrides[key] ?? random_value(
        options.map(({ value }) => value)
      );

      if (value === undefined) {
        if (input_type === 'text_input') {
          value = random_text(10);
        }
        if (input_type === 'long_text_input') {
          value = random_text(100);
        }
        if (input_type === 'dialogue_list') {
          value = [
            { user: random_text(5), character: random_text(5) },
            { user: random_text(5), character: random_text(5) }
          ];
        }
      }

      if (max_select > 1) {
        value = value ? [].concat(value) : [];
      }

      if (depends.length === 0) {
        acc[key] = value;
      } else {
        const satisfied = depends.every(
          ([dep_key, dep_values]) => dep_values.includes(acc[dep_key])
        );

        if (satisfied) {
          acc[key] = value;
        }
      }

      return acc;
    },
    {}
  );
  return settings;
}

export async function createRandomCharacter(
  server, token, override_settings = {}
) {
  const { options } = await getCharacterOptions(server);
  const creation_settings = random_gen_character_setting(
    options, override_settings
  );
  const res = await createCharacter(server, token, creation_settings);
  return res;
}

export async function waitingCharacterAvatarGen(
  server, token,
  cid, avatar_url,
  max_retry = 3
) {
  return waitingExpectToBeTrue(
    () => getCharacter(server, cid, token),
    (char) => {
      expect(char).toHaveProperty('avatar_url', expect.stringContaining(avatar_url));
    },
    max_retry
  );
}


export function likeCharacter(server, token, cid) {
  return postJSON(
    server,
    `/characters/${cid}/like`,
    { token }
  );
}

export function unlikeCharacter(server, token, cid) {
  return deleteJSON(
    server,
    `/characters/${cid}/like`,
    { token }
  );
}

export function followCharacter(server, token, cid) {
  return postJSON(
    server,
    `/characters/${cid}/follow`,
    { token }
  );
}

export function unfollowCharacter(server, token, cid) {
  return deleteJSON(
    server,
    `/characters/${cid}/follow`,
    { token }
  );
}

export function rebuildCharacterAvatar(server, token, cid) {
  return postJSON(
    server,
    `/my/characters/${cid}/avatar`,
    { token },
  );
}

export function updateCharacterDefaultOrder(server, token, cid, default_order) {
  return putJSON(
    server,
    `/ops/characters/${cid}/order/default`,
    { token, body: { default_order } }
  );
}

export const test = baseTest.extend({
  nickname: 'TestUser',
  avatar_url: '/mock-avatar.png',
  // eslint-disable-next-line  no-empty-pattern
  gender: ({}, use) => use(['Female', 'Male'][Math.round(_.random(0, 1))]),
  character_creation_option: async ({ server }, use) => {
    const options = await getCharacterOptions(server);
    await use(options);
  },
  character_random_settings: ({ character_creation_option }, use) => use(
    random_gen_character_setting(character_creation_option.options)
  ),
  character_setting: async (
    { server, token, character_random_settings, avatar_url },
    use
  ) => {
    if (vi.isMockFunction(ai.avatarGen)) {
      ai.avatarGen.mockClear();
      ai.avatarGen.mockResolvedValueOnce({ image_url: avatar_url });
    }

    const { id } = await createCharacter(
      server, token, character_random_settings
    );
    const settings = await getCharacterSetting(server, id, token);

    if (vi.isMockFunction(ai.avatarGen)) {
      await waitingExpectToBeTrue(
        () => {},
        () => {
          expect(ai.avatarGen).toHaveBeenCalledTimes(1);
        }
      );
    }
    await use(settings);
    await deleteCharacter(server, token, id);
  },
  character: async ({ server, token, character_setting, avatar_url }, use) => {
    const cid = character_setting.id;
    const character = await getCharacter(server, cid, token);
    await waitingCharacterAvatarGen(server, token, cid, avatar_url);
    await use(character);
  },
});
