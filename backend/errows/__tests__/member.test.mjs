import { beforeAll, describe, expect, vi } from 'vitest';
import ai from '@errows/ai';
import { test } from './fixtures/member.mjs';
import {
  sendSessionMessage, requestSessionImage,
  deleteMessage,
} from './fixtures/session.mjs';
import {
  createCharacter, deleteCharacter,
  followCharacter, likeCharacter,
  unfollowCharacter, unlikeCharacter,
  rebuildCharacterAvatar
} from './fixtures/character.mjs';
import { waitingExpectToBeTrue } from './lib/utils.mjs';
import {
  createPost, delPost, mockRandomPostImages
} from './fixtures/post.mjs';
import {
  genRandomImageGenSettings, characterGenImage,
  characterGenVideo
} from './fixtures/media.mjs';
import { getMemberStats } from './fixtures/member.mjs';
import { mock_ops_service } from './fixtures/ops.mjs';

const scope = 'member_tests';
const avatar_url = '/avatar-for-members-tests.webp';

test.scoped({
  scope, avatar_url,
  services: ['api', 'user', 'errows', 'payment', mock_ops_service]
});

beforeAll(() => {
  vi.spyOn(ai, 'avatarGen').mockResolvedValue({ image_url: avatar_url });
  vi.spyOn(ai, 'imageGen').mockResolvedValue({ image_url: avatar_url });
  vi.spyOn(ai, 'createVideoGenTask').mockResolvedValue({ request_id: 'mock_request_id' });
  vi.spyOn(ai, 'waitingVideoTaskComplete')
  .mockResolvedValue({
    video_url: '/video-for-members-tests.mp4',
    result: { status: 'COMPLETED' }
  });
  vi.spyOn(ai, 'chatCompletion').mockResolvedValue({ reply: 'This is a mocked AI reply.' });
});

describe('member stats', () => {
  test(
    'character create and delete stats',
    async ({
      server, token,
      character_random_settings
    }) => {

      const character = await createCharacter(
        server, token, character_random_settings
      );
      await expectMemberStatsToBe(
        server, token,
        {
          media_images: 1,
          media_videos: 0,
          characters_public: 0,
          characters_private: 1,
          characters_deleted: 0,
          characters_followed: 0,
          characters_liked: 0
        }
      );

      await rebuildCharacterAvatar(server, token, character.id);
      await expectMemberStatsToBe(
        server, token,
        {
          media_images: 2,
          media_videos: 0,
          characters_public: 0,
          characters_private: 1,
          characters_deleted: 0,
          characters_followed: 0,
          characters_liked: 0
        }
      );

      await deleteCharacter(server, token, character.id);
      await expectMemberStatsToBe(
        server, token,
        {
          characters_public: 0,
          characters_private: 0,
          characters_deleted: 1,
          characters_followed: 0,
          characters_liked: 0
        }
      );
    }
  );

  test('character liked', async ({
    server, token,
    character
  }) => {
    const cid = character.id;

    await expectMemberStatsToBe(server, token, {
      characters_liked: 0
    });

    await likeCharacter(server, token, cid);
    await expectMemberStatsToBe(server, token, {
      characters_liked: 1
    });

    await unlikeCharacter(server, token, cid);
    await expectMemberStatsToBe(server, token, {
      characters_liked: 0
    });
  });

  test('character follow', async ({ server, token, character }) => {
    const cid = character.id;

    await expectMemberStatsToBe(server, token, {
      characters_followed: 0
    });

    await followCharacter(server, token, cid);
    await expectMemberStatsToBe(server, token, {
      characters_followed: 1
    });

    await unfollowCharacter(server, token, cid);
    await expectMemberStatsToBe(server, token, {
      characters_followed: 0
    });
  });

  test('session count', async ({ server, token, session }) => {
    await expectMemberStatsToBe(
      server, token,
      { media_images: 1, session_messages: 0 }
    );
    await requestSessionImage(
      server, token, session.id
    );
    await expectMemberStatsToBe(
      server, token,
      { media_images: 2, session_messages: 1 }
    );

    const messageReply = await sendSessionMessage(
      server, token,
      session.id,
      'Hello, this is a test message from user.'
    );
    await expectMemberStatsToBe(
      server, token,
      { session_messages: 2 }
    );

    await deleteMessage(server, token, session.id, messageReply.send_message_id);
    await expectMemberStatsToBe(
      server, token,
      { session_messages: 1 }
    );
  });

  test('post count', async ({ server, token, character }) => {
    const images = await mockRandomPostImages(server, token, character.id);
    const post = await createPost(
      server, token,
      character.id,
      'Test Post', 'This is a test post.',
      images.map(img => img.id)
    );

    await expectMemberStatsToBe(
      server, token,
      { characters_private: 1, posts: 1 }
    );

    await delPost(server, token, character.id, post.id);
    await expectMemberStatsToBe(
      server, token,
      { characters_private: 1, posts: 0 }
    );
  });

  test(
    'media count',
    async ({ server, token, character }) => {
      await expectMemberStatsToBe(
        server, token,
        { media_images: 1, media_videos: 0 }
      );

      const image_settings = await genRandomImageGenSettings(
        server, token, character.gender
      );
      const { asset: image } = await characterGenImage(
        server, token, character.id,
        image_settings
      );
      await expectMemberStatsToBe(
        server, token,
        { media_images: 2, media_videos: 0 }
      );

      await characterGenVideo(
        server, token, character.id, image.id
      );
      await expectMemberStatsToBe(
        server, token,
        { media_images: 2, media_videos: 1 }
      );
    }
  );
});



async function expectMemberStatsToBe(server, token, expected) {
  const stats = await getMemberStats(server, token);
  isMemberStats(stats);
  await waitingExpectToBeTrue(
    () => getMemberStats(server, token),
    (stats) => {
      isMemberStats(stats);
      expect(stats).toMatchObject(expected);
    },
    2
  );
}


function isMemberStats(stats) {
  expect(stats).toBeDefined();
  expect(stats).toHaveProperty('media_images', expect.any(Number));
  expect(stats).toHaveProperty('media_videos', expect.any(Number));
  expect(stats).toHaveProperty('characters_public', expect.any(Number));
  expect(stats).toHaveProperty('characters_private', expect.any(Number));
  expect(stats).toHaveProperty('characters_deleted', expect.any(Number));
  expect(stats).toHaveProperty('characters_followed', expect.any(Number));
  expect(stats).toHaveProperty('characters_liked', expect.any(Number));
  expect(stats).toHaveProperty('session_messages', expect.any(Number));
  expect(stats).toHaveProperty('posts', expect.any(Number));
}
