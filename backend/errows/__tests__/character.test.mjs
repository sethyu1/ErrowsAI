import {
  describe, beforeEach, expect, vi,
  onTestFinished
} from "vitest";
import ai from "@errows/ai";
import {
  test,
  getCharacterSetting, getCharacter,
  createCharacter,
  deleteCharacter,
  random_gen_character_setting,
  createRandomCharacter,
  likeCharacter, unlikeCharacter,
  followCharacter, unfollowCharacter,
  rebuildCharacterAvatar,
  listCharacters,
  listMyCharacters,
  createCharacterWithAvatar,
  waitingCharacterAvatarGen,
  updateCharacterDefaultOrder
} from './fixtures/character.mjs';
import _ from "lodash";
import { mockAIImageServer } from './fixtures/ai.mjs';
import { mock_payment_service } from "./fixtures/payment.mjs";
import { waitingExpectToBeTrue } from "./lib/utils.mjs";
import { putJSON } from "./lib/api.mjs";
import { methods as errowsMethods } from "../services/libs/errows.mjs";
import { createRandomUser, deleteAccount } from "./fixtures/user.mjs";
import {
  updateCharacterRecommendation,
  updateCharacterStatus
} from "./fixtures/ops.mjs";

const scope = 'errows_character_tests';
const avatar_url = '/avatar-for-character.png';
test.scoped({
  scope, avatar_url,
  services:['api', 'user', 'errows', 'ops', mock_payment_service],
});


beforeEach(() => {
  vi.spyOn(ai, 'avatarGen').mockResolvedValue({ image_url: avatar_url });
  vi.spyOn(errowsMethods, 'deductCoinsByImageGen').mockResolvedValue();
});

describe('character creation', () => {
  test('character creation option', async ({ character_creation_option }) => {
    expect(character_creation_option).toHaveProperty('options', expect.any(Array));
    const { options } = character_creation_option;
    options.forEach(option => {
      expect(option).toHaveProperty('key', expect.any(String));
      expect(option).toHaveProperty('title', expect.any(String));
      expect(option).toHaveProperty('required', expect.any(Boolean));
      expect(option).toHaveProperty('max_select', expect.any(Number));
      expect(option).toHaveProperty('depends', expect.any(Array));
      option.depends.forEach(([key, values]) => {
        expect(key).toEqual(expect.any(String));
        expect(values).toEqual(expect.any(Array));
        values.forEach(value => {
          expect(value).toEqual(expect.any(String));
        });
      });

      expect(option).toHaveProperty('input_type', expect.any(String));
      expect(option).toHaveProperty('options', expect.any(Array));
      const input_type = option.input_type;
      option.options.forEach(opt => {
        expect(opt).not.toHaveProperty('settings', expect.any(Object));
        expect(opt).toHaveProperty('value', expect.any(String));

        if ([
          'image_select', 'multi_image_select',
          'voice_select'
        ].includes(input_type)) {
          expect(opt).toHaveProperty('url', expect.any(String));
        }

        if (input_type === 'color_select') {
          expect(opt).toHaveProperty('color', expect.any(String));
        }

        if (input_type === 'text_select') {
          expect(opt).toHaveProperty(
            'group',
            expect.toBeOneOf([null, expect.any(String)])
          );
        }

        if (input_type === 'long_text_input') {
          expect(opt).toHaveProperty('title', expect.any(String));
        }
      });
    });
  });

  test(
    'create character',
    async ({ server, token, character_random_settings })  => {
      const {
        resolveRequest, tryToCheckRequestCalled, close
      } = await mockAIImageServer();
      onTestFinished(() => close());
      const social = {
        comments_count: 0,
        likes_count: 0,
        followed_count: 0,
        posted_count: 0,
        dialogues_count: 0,
        video_count: 0,
        intimacy_score: 0,
      };

      const character_setting = await createCharacter(
        server, token, character_random_settings
      );
      expect(character_setting).toHaveProperty('id', expect.any(String));
      expect(character_setting).not.toHaveProperty('identity', expect.any(Object));
      expect(character_setting).not.toHaveProperty('style', expect.any(Object));
      expect(character_setting).not.toHaveProperty('dialogue', expect.any(Object));

      await tryToCheckRequestCalled();

      const character = await getCharacter(server, character_setting.id);
      isCharacter(character);

      expect(character).toHaveProperty('status', 'generating');
      expect(character).toHaveProperty('id', character_setting.id);
      const identity_keys = [
        'nickname', 'introduction', 'gender',
        'type', 'assortment', "race",
        'age'
      ];
      for (const key of identity_keys) {
        expect(character).toHaveProperty(key, character_random_settings[key]);
      }
      expect(character).toHaveProperty('avatar_url', null);
      expect(character).toHaveProperty('social', social);

      const characterList = await listCharacters(server);
      expect(characterList).toHaveProperty('count', 0);

      const myCharacters = await listMyCharacters(server, token, 'owned');
      expect(myCharacters).toHaveProperty('count', 1);
      expect(myCharacters.data[0]).toHaveProperty('id', character_setting.id);
      expect(myCharacters.data[0]).toHaveProperty('status', 'generating');

      await resolveRequest({ image_url: avatar_url });

      const newCharacter = await waitingExpectToBeTrue(
        () => getCharacter(server, character.id),
        (res) => {
          expect(res).toHaveProperty('status', 'private');
        }
      );
      expect(newCharacter)
      .toHaveProperty('avatar_url', expect.stringContaining(avatar_url));
      expect(newCharacter.avatar_url).toMatch(/^https?:\/\//);

      await deleteCharacter(server, token, character.id);
    }
  );
});

describe('character settings', () => {
  test('update character settings', async ({
    server, token, character_setting,
  }) => {
    const updatedStyle = {
      ...character_setting,
      hair_color: 'red',
      body_type: 'slim',
      tags: ['warrior', 'brave', 'loyal', 'strategist']
    };

    const updated = await putJSON(
      server,
      `/my/characters/${character_setting.id}/settings`,
      { token, body: { ...updatedStyle } }
    );
    expect(updated).toBeUndefined();

    const newSetting = await getCharacterSetting(
      server, character_setting.id, token
    );
    expect(newSetting).toMatchObject(
      _.omit(updatedStyle, ['updated_at', 'avatar_url'])
    );
    expect(new Date(newSetting.updated_at).getTime()).greaterThan(
      new Date(character_setting.updated_at).getTime()
    );
  });

  test(
    'regenerate character avatar',
    async ({
      server, token,
      character,
    }) => {
      const {
        tryToCheckRequestCalled, resolveRequest, close
      } = await mockAIImageServer();
      onTestFinished(() => close());
      const new_avatar_url = '/avatar-for-character-2.png';

      const rebuildPromise = rebuildCharacterAvatar(server, token, character.id);

      await tryToCheckRequestCalled();
      const generatingRes = await getCharacter(server, character.id);
      expect(generatingRes).toHaveProperty('status', 'generating');
      const generatingList = await listMyCharacters(server, token, 'owned');
      expect(generatingList).toHaveProperty('count', 1);
      expect(generatingList.data[0]).toHaveProperty('status', 'generating');

      // Simulate AI image generation completion
      await resolveRequest({ image_url: new_avatar_url });
      await rebuildPromise;

      const characterRes = await getCharacter(server, character.id);
      expect(characterRes).toHaveProperty('status', 'private');
      expect(characterRes).toHaveProperty('avatar_url', expect.stringContaining(new_avatar_url));
      expect(characterRes.avatar_url).toMatch(/^https?:\/\//);
      Object.assign(character, characterRes);
    }
  );
});

describe('character list', () => {
  test(
    'list character',
    async ({ server, token, sysadmin_token, character, avatar_url }) => {
      await waitingCharacterAvatarGen(server, token, character.id, avatar_url);
      const beforeList = await listCharacters(server);
      expect(beforeList).toHaveProperty('count', 0);

      await updateCharacterStatus(server, sysadmin_token, character.id, 'public');

      const res = await listCharacters(server);
      const {
        status: _status, updated_at: _updated_at, avatar_url: _avatar_url,
        ...rest
      } = character;
      expect(res).toHaveProperty('count', 1);
      expect(res).toHaveProperty('data', expect.any(Array));
      res.data.forEach(isCharacter);
      expect(res.data[0]).toMatchObject(rest);
    }
  );

  test(
    'identity filter',
    async ({ server, token, sysadmin_token }) => {
      const c1 = await createCharacterWithAvatar(server, token, { type: 'anime' });
      await updateCharacterStatus(server, sysadmin_token, c1.id, 'public');
      const c2 = await createCharacterWithAvatar(server, token, { type: 'realistic' });
      await updateCharacterStatus(server, sysadmin_token, c2.id, 'public');

      const listAnime = await listCharacters(server, { tags: [['type', ['anime']]] });
      expect(listAnime).toHaveProperty('count', 1);
      expect(listAnime.data[0]).toHaveProperty('id', c1.id);

      const listRealistic = await listCharacters(server, { tags: [['type', ['realistic']]] });
      expect(listRealistic).toHaveProperty('count', 1);
      expect(listRealistic.data[0]).toHaveProperty('id', c2.id);

      const allTypes = await listCharacters(
        server, { tags: [['type', ['anime', 'realistic']]] }
      );
      expect(allTypes).toHaveProperty('count', 2);
      const ids = allTypes.data.map(c => c.id);
      expect(ids).toContain(c1.id);
      expect(ids).toContain(c2.id);

      await deleteCharacter(server, token, c1.id);
      await deleteCharacter(server, token, c2.id);
    }
  );

  test(
    'style filter',
    async ({ server, token, sysadmin_token }) => {
      const c1 = await createCharacterWithAvatar(server, token, { hair_color: 'black' });
      await updateCharacterStatus(server, sysadmin_token, c1.id, 'public');
      const c2 = await createCharacterWithAvatar(server, token, { hair_color: 'blonde' });
      await updateCharacterStatus(server, sysadmin_token, c2.id, 'public');

      const listBlackHair = await listCharacters(
        server, { tags: [['hair_color', ['black']]] }
      );
      expect(listBlackHair).toHaveProperty('count', 1);
      expect(listBlackHair.data[0]).toHaveProperty('id', c1.id);

      const listBlondeHair = await listCharacters(
        server, { tags: [['hair_color', ['blonde']]] }
      );
      expect(listBlondeHair).toHaveProperty('count', 1);
      expect(listBlondeHair.data[0]).toHaveProperty('id', c2.id);

      const allHairColors = await listCharacters(
        server, { tags: [['hair_color', ['black', 'blonde']]] }
      );
      expect(allHairColors).toHaveProperty('count', 2);
      const ids = allHairColors.data.map(c => c.id);
      expect(ids).toContain(c1.id);
      expect(ids).toContain(c2.id);

      await deleteCharacter(server, token, c1.id);
      await deleteCharacter(server, token, c2.id);
    }
  );
});

describe('like and follow', () => {
  test(
    'like and unlike character',
    async ({ server, token, sysadmin_token, character }) => {
      await updateCharacterStatus(server, sysadmin_token, character.id, 'public');
      await expect(likeCharacter(server, token, character.id)).resolves.toBeUndefined();
      const likeRes = await getCharacter(server, character.id, token);
      expect(likeRes.social.likes_count).toBe(1);
      expect(likeRes.liked).toEqual(true);

      const listLiked = await listCharacters(server, {}, token);
      expect(listLiked).toHaveProperty('count', 1);
      expect(listLiked.data[0]).toHaveProperty('liked', true);

      await expect(
        unlikeCharacter(server, token, character.id)
      ).resolves.toBeUndefined();
      const unlikeRes = await getCharacter(server, character.id, token);
      expect(unlikeRes.social.likes_count).toBe(0);
      expect(unlikeRes.liked).toEqual(false);

      const updatedListLiked = await listCharacters(server, {}, token);
      expect(updatedListLiked).toHaveProperty('count', 1);
      expect(updatedListLiked.data[0]).toHaveProperty('liked', false);
    }
  );

  test('unlike non-liked character', async ({ server, token, character }) => {
    await expect(
      unlikeCharacter(server, token, character.id)
    ).resolves.toBeUndefined();
    const res = await getCharacter(server, character.id);
    expect(res.social.likes_count).toBe(0);
  });

  test(
    'follow and unfollow character',
    async ({ server, token, sysadmin_token, character }) => {
      await updateCharacterStatus(server, sysadmin_token, character.id, 'public');
      await expect(
        followCharacter(server, token, character.id)
      ).resolves.toBeUndefined();
      const followRes = await getCharacter(server, character.id, token);
      expect(followRes.social.followed_count).toBe(1);
      expect(followRes.followed).toEqual(true);

      const listFollowed = await listCharacters(server, {}, token);
      expect(listFollowed).toHaveProperty('count', 1);
      expect(listFollowed.data[0]).toHaveProperty('followed', true);

      await expect(
        unfollowCharacter(server, token, character.id)
      ).resolves.toBeUndefined();
      const unfollowRes = await getCharacter(server, character.id, token);
      expect(unfollowRes.social.followed_count).toBe(0);
      expect(unfollowRes.followed).toEqual(false);

      const updatedListFollowed = await listCharacters(server, {}, token);
      expect(updatedListFollowed).toHaveProperty('count', 1);
      expect(updatedListFollowed.data[0]).toHaveProperty('followed', false);
    }
  );

  test('unfollow non-followed character', async ({ server, token, character }) => {
    await expect(
      unfollowCharacter(server, token, character.id)
    ).resolves.toBeUndefined();
    const unfollowRes = await getCharacter(server, character.id);
    expect(unfollowRes.social.followed_count).toBe(0);
  });

  test('unfollow non-followed character', async ({ server, token, character }) => {
    await expect(
      unfollowCharacter(server, token, character.id)
    ).resolves.toBeUndefined();
    const res = await getCharacter(server, character.id);
    expect(res.social.followed_count).toBe(0);
  });
});

describe('my characters', async () => {
  describe('type filter', () => {
    test('owned', async ({ server, token, character }) => {
      const res = await listMyCharacters(server, token, 'owned');

      const expected = _.omit(character, ['status', 'updated_at', 'avatar_url']);
      expect(res).toHaveProperty('count', 1);
      expect(res).toHaveProperty('data', expect.any(Array));
      expect(res.data[0]).toMatchObject(expected);
    });

    test(
      'deleted',
      async ({ server, token, avatar_url, character_creation_option }) => {
        const settings = random_gen_character_setting(
          character_creation_option.options
        );
        const character = await createCharacter(server, token, settings);
        await waitingCharacterAvatarGen(server, token, character.id, avatar_url);
        await deleteCharacter(server, token, character.id);

        const listOwned = await listMyCharacters(server, token, 'owned');
        expect(listOwned).toHaveProperty('count', 0);

        const listDeleted = await listMyCharacters(server, token, 'deleted');
        expect(listDeleted).toHaveProperty('count', 1);
        expect(listDeleted.data[0]).toHaveProperty('id', character.id);
      }
    );

    test('liked', async ({ server, token, character }) => {
      const listLiked = await listMyCharacters(server, token, 'liked');
      expect(listLiked).toHaveProperty('count', 0);

      await likeCharacter(server, token, character.id);

      const updatedListLiked = await listMyCharacters(server, token, 'liked');
      expect(updatedListLiked).toHaveProperty('count', 1);
      expect(updatedListLiked.data[0]).toHaveProperty('id', character.id);
    });

    test('followed', async ({ server, token, character }) => {
      const listFollowed = await listMyCharacters(server, token, 'followed');
      expect(listFollowed).toHaveProperty('count', 0);

      await followCharacter(server, token, character.id);

      const updatedListFollowed = await listMyCharacters(server, token, 'followed');
      expect(updatedListFollowed).toHaveProperty('count', 1);
      expect(updatedListFollowed.data[0]).toHaveProperty('id', character.id);
    });
  });

  describe('sort', () => {
    test('newest', async ({ server, token }) => {
      const c1 = await createRandomCharacter(server, token);
      const c2 = await createRandomCharacter(server, token);

      const listRes = await listMyCharacters(
        server, token, 'owned', { sort: 'newest' }
      );
      expect(listRes).toHaveProperty('count', 2);
      expect(listRes.data[0]).toHaveProperty('id', c2.id);
      expect(listRes.data[1]).toHaveProperty('id', c1.id);

      await deleteCharacter(server, token, c1.id);
      await deleteCharacter(server, token, c2.id);
    });

    test('latest', async ({ server, token }) => {
      const c1 = await createRandomCharacter(server, token);
      const c2 = await createRandomCharacter(server, token);

      const listRes = await listMyCharacters(
        server, token, 'owned', { sort: 'latest' }
      );
      expect(listRes).toHaveProperty('count', 2);
      expect(listRes.data[0]).toHaveProperty('id', c2.id);
      expect(listRes.data[1]).toHaveProperty('id', c1.id);

      await deleteCharacter(server, token, c1.id);
      await deleteCharacter(server, token, c2.id);
    });

    test('created', async ({ server, token }) => {
      const c1 = await createRandomCharacter(server, token);
      const c2 = await createRandomCharacter(server, token);

      const listRes = await listMyCharacters(
        server, token, 'owned', { sort: 'created' }
      );
      expect(listRes).toHaveProperty('count', 2);
      expect(listRes.data[0]).toHaveProperty('id', c2.id);
      expect(listRes.data[1]).toHaveProperty('id', c1.id);

      await deleteCharacter(server, token, c1.id);
      await deleteCharacter(server, token, c2.id);
    });

    test('alphabetical', async ({ server, token }) => {
      const c1 = await createRandomCharacter(
        server, token, { nickname: 'Alice' }
      );
      const c2 = await createRandomCharacter(
        server, token, { nickname: 'Bob' }
      );

      const listRes = await listMyCharacters(server, token, 'owned', {
        sort: 'alphabetical'
      });
      expect(listRes).toHaveProperty('count', 2);
      expect(listRes.data[0]).toHaveProperty('id', c1.id);
      expect(listRes.data[1]).toHaveProperty('id', c2.id);

      await deleteCharacter(server, token, c1.id);
      await deleteCharacter(server, token, c2.id);
    });

    test('most like', async ({ server, token }) => {
      const c1 = await createRandomCharacter(server, token);
      const c2 = await createRandomCharacter(server, token);

      await likeCharacter(server, token, c1.id);

      const listRes = await listMyCharacters(
        server, token, 'owned', { sort: 'most_liked' }
      );
      expect(listRes).toHaveProperty('count', 2);
      expect(listRes.data[0].social.likes_count)
      .toBeGreaterThan(listRes.data[1].social.likes_count);
      expect(listRes.data[0]).toHaveProperty('id', c1.id);
      expect(listRes.data[1]).toHaveProperty('id', c2.id);

      await deleteCharacter(server, token, c1.id);
      await deleteCharacter(server, token, c2.id);
    });

    test('most followed', async ({ server, token }) => {
      const c1 = await createRandomCharacter(server, token);
      const c2 = await createRandomCharacter(server, token);

      await followCharacter(server, token, c1.id);

      const listRes = await listMyCharacters(
        server, token, 'owned', { sort: 'popular' }
      );
      expect(listRes).toHaveProperty('count', 2);
      expect(listRes.data[0].social.followed_count)
      .toBeGreaterThan(listRes.data[1].social.followed_count);
      expect(listRes.data[0]).toHaveProperty('id', c1.id);
      expect(listRes.data[1]).toHaveProperty('id', c2.id);

      await deleteCharacter(server, token, c1.id);
      await deleteCharacter(server, token, c2.id);
    });
  });

  describe('search', () => {
    test('by nickname', async ({ server, token }) => {
      const c1 = await createRandomCharacter(
        server, token, { nickname: 'Charlie' }
      );
      const c2 = await createRandomCharacter(
        server, token, { nickname: 'David' }
      );

      const listRes = await listMyCharacters(
        server, token, 'owned', { q: 'Char' }
      );
      expect(listRes).toHaveProperty('count', 1);
      expect(listRes.data[0]).toHaveProperty('id', c1.id);

      await deleteCharacter(server, token, c1.id);
      await deleteCharacter(server, token, c2.id);
    });
  });

});

describe('handle user account deleted', () => {
  test(
    'character deleted after user account deleted',
    async ({ server, sysadmin_token, character }) => {
      await updateCharacterStatus(server, sysadmin_token, character.id, 'public');

      const { id: uid, token } = await createRandomUser(server);
      const character_will_delete = await createRandomCharacter(server, token);
      await waitingCharacterAvatarGen(server, token, character_will_delete.id, avatar_url);
      await updateCharacterStatus(server, sysadmin_token, character_will_delete.id, 'public');

      await waitingExpectToBeTrue(
        () => listCharacters(server),
        (res) => {
          expect(res).toHaveProperty('count', 2);
          expect(res.data[0]).toHaveProperty('id', character_will_delete.id);
          expect(res.data[0]).toHaveProperty(
            'owner', expect.objectContaining({ id: uid })
          );
        }
      );

      // Delete user account
      await deleteAccount(server, token);

      await waitingExpectToBeTrue(
        () => listCharacters(server),
        (res) => {
          expect(res).toHaveProperty('count', 1);
          expect(res.data[0]).toHaveProperty('id', character.id);
        }
      );

      await expect(getCharacter(server, character_will_delete.id))
      .resolves.toMatchObject({
        'id': character_will_delete.id,
        status: 'deleted',
      });
    }
  );
});

describe('character recommendation', () => {
  test(
    'update character recommendation status',
    async ({ server, sysadmin_token, token, character_random_settings }) => {
      // Create a character
      const character = await createRandomCharacter(
        server, token, character_random_settings
      );
      await waitingCharacterAvatarGen(server, token, character.id, avatar_url);
      // Make it public first
      await updateCharacterStatus(server, sysadmin_token, character.id, 'public');

      // Set as recommended
      await updateCharacterRecommendation(
        server, sysadmin_token, character.id, true
      );

      // Verify it appears in recommended list
      const recommendedList = await listCharacters(
        server, { recommended: true }
      );
      expect(recommendedList).toHaveProperty('count', 1);
      expect(recommendedList.data[0]).toHaveProperty('id', character.id);

      // Create another character
      const character2 = await createRandomCharacter(
        server, token, character_random_settings
      );

      // Make it public
      await putJSON(
        server,
        `/ops/characters/${character2.id}/status`,
        { token: sysadmin_token, body: { status: 'public' } }
      );

      // Should not appear in recommended list
      const recommendedList2 = await listCharacters(
        server, { recommended: true }
      );
      expect(recommendedList2).toHaveProperty('count', 1);
      expect(recommendedList2.data[0]).toHaveProperty('id', character.id);

      // Unset recommendation
      await updateCharacterRecommendation(
        server, sysadmin_token, character.id, false
      );

      // Should not appear in recommended list anymore
      const recommendedList3 = await listCharacters(
        server, { recommended: true }
      );
      expect(recommendedList3).toHaveProperty('count', 0);
    }
  );

  test(
    'list only recommended characters',
    async ({ server, sysadmin_token, token, character_random_settings }) => {
      // Create multiple characters
      const char1 = await createRandomCharacter(
        server, token, character_random_settings
      );
      const char2 = await createRandomCharacter(
        server, token, character_random_settings
      );
      const char3 = await createRandomCharacter(
        server, token, character_random_settings
      );

      // Make all public
      for (const char of [char1, char2, char3]) {
        await putJSON(
          server,
          `/ops/characters/${char.id}/status`,
          { token: sysadmin_token, body: { status: 'public' } }
        );
      }

      // Set char1 and char3 as recommended
      await updateCharacterRecommendation(
        server, sysadmin_token, char1.id, true
      );
      await updateCharacterRecommendation(
        server, sysadmin_token, char3.id, true
      );

      // List only recommended characters
      const recommendedList = await listCharacters(
        server, { recommended: true }
      );
      expect(recommendedList).toHaveProperty('count', 2);
      const ids = recommendedList.data.map(c => c.id);
      expect(ids).toContain(char1.id);
      expect(ids).toContain(char3.id);
      expect(ids).not.toContain(char2.id);

      // List all characters (without recommended filter)
      const allList = await listCharacters(server);
      expect(allList.count).toBeGreaterThanOrEqual(3);
    }
  );
});

describe('character default order', () => {
  test(
    'update character default order and verify sorting',
    async ({ server, sysadmin_token, token, character_random_settings }) => {
      // Create 3 characters
      const char1 = await createRandomCharacter(server, token, character_random_settings);
      const char2 = await createRandomCharacter(server, token, character_random_settings);
      const char3 = await createRandomCharacter(server, token, character_random_settings);

      // Wait for avatars to be generated
      await waitingCharacterAvatarGen(server, token, char1.id, avatar_url);
      await waitingCharacterAvatarGen(server, token, char2.id, avatar_url);
      await waitingCharacterAvatarGen(server, token, char3.id, avatar_url);

      // Make them public
      await putJSON(server, `/ops/characters/${char1.id}/status`, {
        token: sysadmin_token,
        body: { status: 'public' }
      });
      await putJSON(server, `/ops/characters/${char2.id}/status`, {
        token: sysadmin_token,
        body: { status: 'public' }
      });
      await putJSON(server, `/ops/characters/${char3.id}/status`, {
        token: sysadmin_token,
        body: { status: 'public' }
      });

      // Set default_order: char2 (10) < char3 (20) < char1 (30)
      await updateCharacterDefaultOrder(server, sysadmin_token, char1.id, 30);
      await updateCharacterDefaultOrder(server, sysadmin_token, char2.id, 10);
      await updateCharacterDefaultOrder(server, sysadmin_token, char3.id, 20);

      // List characters without sort parameter - should be ordered by default_order
      const list = await listCharacters(server, {}, token);

      // Filter to only our test characters
      const testChars = list.data.filter(c =>
        [char1.id, char2.id, char3.id].includes(c.id)
      );

      // Verify all 3 characters are in the list
      expect(testChars.length).toBe(3);

      // Verify ordering: char2 (order 10) should come first, then char3 (order 20), then char1 (order 30)
      const char2Idx = testChars.findIndex(c => c.id === char2.id);
      const char3Idx = testChars.findIndex(c => c.id === char3.id);
      const char1Idx = testChars.findIndex(c => c.id === char1.id);

      // Since they're filtered to only our test chars, indices should be 0, 1, 2
      expect(char2Idx).toBe(0);
      expect(char3Idx).toBe(1);
      expect(char1Idx).toBe(2);

      // Cleanup
      await deleteCharacter(server, token, char1.id);
      await deleteCharacter(server, token, char2.id);
      await deleteCharacter(server, token, char3.id);
    }
  );

  test(
    'characters without default_order are sorted after those with default_order',
    async ({ server, sysadmin_token, token, character_random_settings }) => {
      // Create 2 characters
      const charWithOrder = await createRandomCharacter(server, token, character_random_settings);
      const charWithoutOrder = await createRandomCharacter(server, token, character_random_settings);

      // Wait for avatars
      await waitingCharacterAvatarGen(server, token, charWithOrder.id, avatar_url);
      await waitingCharacterAvatarGen(server, token, charWithoutOrder.id, avatar_url);

      // Make them public
      await putJSON(server, `/ops/characters/${charWithOrder.id}/status`, {
        token: sysadmin_token,
        body: { status: 'public' }
      });
      await putJSON(server, `/ops/characters/${charWithoutOrder.id}/status`, {
        token: sysadmin_token,
        body: { status: 'public' }
      });

      // Set default_order only for one character (high value to ensure it comes before NULL)
      await updateCharacterDefaultOrder(server, sysadmin_token, charWithOrder.id, 1);

      // List characters
      const list = await listCharacters(server, {}, token);

      // Filter to only our test characters
      const testChars = list.data.filter(c =>
        [charWithOrder.id, charWithoutOrder.id].includes(c.id)
      );

      // Verify both characters are in the list
      expect(testChars.length).toBe(2);

      // Character with default_order should come before one without (NULLS LAST)
      const withOrderIdx = testChars.findIndex(c => c.id === charWithOrder.id);
      const withoutOrderIdx = testChars.findIndex(c => c.id === charWithoutOrder.id);

      expect(withOrderIdx).toBe(0);
      expect(withoutOrderIdx).toBe(1);

      // Cleanup
      await deleteCharacter(server, token, charWithOrder.id);
      await deleteCharacter(server, token, charWithoutOrder.id);
    }
  );
});

function isCharacterOwner(owner) {
  expect(owner).toHaveProperty('id', expect.any(String));
  expect(owner).toHaveProperty('name', expect.any(String));
  expect(owner).toHaveProperty('avatar', expect.toBeOneOf([expect.any(String), null]));
}

function isCharacterSocial(social) {
  expect(social).toHaveProperty('comments_count', expect.any(Number));
  expect(social).toHaveProperty('likes_count', expect.any(Number));
  expect(social).toHaveProperty('followed_count', expect.any(Number));
  expect(social).toHaveProperty('posted_count', expect.any(Number));
  expect(social).toHaveProperty('dialogues_count', expect.any(Number));
  expect(social).toHaveProperty('video_count', expect.any(Number));
  expect(social).toHaveProperty('intimacy_score', expect.any(Number));
}

function isCharacter(character) {
  expect(character).toHaveProperty('id', expect.any(String));
  expect(character).toHaveProperty('nickname', expect.any(String));
  expect(character).toHaveProperty('introduction', expect.any(String));
  expect(character).toHaveProperty('gender', expect.any(String));
  expect(character).toHaveProperty('type', expect.any(String));
  expect(character).toHaveProperty('assortment', expect.any(String));
  expect(character).toHaveProperty('race', expect.any(String));
  expect(character).toHaveProperty('age', expect.any(String));

  expect(character).toHaveProperty('liked', expect.toBeOneOf([true, false]));
  expect(character).toHaveProperty('followed', expect.toBeOneOf([true, false]));

  expect(character).toHaveProperty(
    'avatar_url', expect.toBeOneOf([expect.any(String), null])
  );
  if (character.avatar_url !== null) {
    expect(character.avatar_url).toMatch(/^https?:\/\//);
  }
  expect(character).toHaveProperty(
    'status',
    expect.toBeOneOf(['pending', 'generating', 'private', 'public', 'deleted'])
  );

  expect(character).toHaveProperty('owner', expect.any(Object));
  isCharacterOwner(character.owner);

  expect(character).toHaveProperty('social', expect.any(Object));
  isCharacterSocial(character.social);

  expect(character).toHaveProperty('created_at', expect.any(String));
  expect(character).toHaveProperty('updated_at', expect.any(String));

  expect(character).not.toHaveProperty('identity', expect.any(Object));
  expect(character).not.toHaveProperty('style', expect.any(Object));
  expect(character).not.toHaveProperty('dialogue', expect.any(Object));
}

