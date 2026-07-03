import ai from '@errows/ai';
import {
  describe, expect, vi, onTestFailed,
  beforeEach, beforeAll
} from 'vitest';
import {
  test,
  listCharacterImageStats,
  listCharacterImages,
  createCharacterImageGenTask,
  getCharacterImageGenTaskResult,
  retryCharacterImageGenTask,
  listCharacterVideos,
  createVideoGenerationTask,
  listCharacterVideoTasks,
  listCharacterVideoStats,
  getVideoGenerationTask,
  listCharacterImageGenTasks,
  characterGenVideo,
  characterGenImage,
  deleteCharacterImage,
  deleteCharacterVideo
} from './fixtures/media.mjs';
import {
  createRandomCharacter, deleteCharacter,
  rebuildCharacterAvatar, waitingCharacterAvatarGen
} from './fixtures/character.mjs';
import { createRandomUser } from './fixtures/user.mjs';
import { mockAIImageServer, mockAIVideoTaskServer } from './fixtures/ai.mjs';
import { waitingExpectToBeTrue } from './lib/utils.mjs';
import { methods as errowsMethods } from '../services/libs/errows.mjs';
import { mock_payment_service } from './fixtures/payment.mjs';

const scope = 'errows_media_tests';
const avatar_url = 'User_Generate/avatar-for-media-default.png';
const image_gen_url = 'User_Generate/image-gen-for-media-default.png';

test.scoped({
  scope, avatar_url,
  services: ['errows', 'user', 'api', mock_payment_service]
});

beforeAll(() => {
  vi.spyOn(errowsMethods, 'deductCoinsByImageGen').mockReturnValue();
});

beforeEach(() => {
  vi.spyOn(ai, 'avatarGen').mockResolvedValue({ image_url: avatar_url });
  vi.spyOn(ai, 'imageGen').mockResolvedValue({ image_url: image_gen_url });
});

describe('basic', () => {
  test('image generation options', async ({ character_image_gen_steps }) => {
    expect(character_image_gen_steps).toBeInstanceOf(Array);
    expect(character_image_gen_steps.length).toBeGreaterThan(0);

    character_image_gen_steps.forEach(step => {
      expect(step).toHaveProperty('key', expect.any(String));
      expect(step).toHaveProperty('title', expect.any(String));
      expect(step).toHaveProperty('gender', expect.any(String));
      expect(step).toHaveProperty('min_select', expect.any(Number));
      expect(step).toHaveProperty('max_select', expect.any(Number));
      expect(step).toHaveProperty('options', expect.any(Array));
      expect(step.options.length).toBeGreaterThan(0);

      step.options.forEach(option => {
        expect(option).toHaveProperty('value', expect.any(String));
        expect(option).toHaveProperty('url', expect.any(String));
        expect(option).toHaveProperty('prompts', expect.any(Array));
        expect(option.prompts.length).toBeGreaterThanOrEqual(0);
        option.prompts.forEach(prompt => {
          expect(prompt).toBeTypeOf('string');
        });
      });
    });
  });
});

describe('images', () => {
  test(
    'character avatar should in media folder',
    async ({ server, token, avatar_url, character_setting }) => {
      const cid = character_setting.id;
      expect(ai.avatarGen).toHaveBeenCalledTimes(1);
      const character = await waitingCharacterAvatarGen(
        server, token, cid, avatar_url
      );
      const images = await listCharacterImageStats(server, token);
      expect(images).toBeInstanceOf(Array);
      expect(images).toHaveLength(1);
      images.forEach(isAssetImageSummary);
      expect(images[0]).toHaveProperty('cover', character.avatar_url);
      expect(images[0].character).toHaveProperty('id', character.id);
      expect(images[0]).toHaveProperty('count', 1);

      const {
        tryToCheckRequestCalled, resolveRequest, close
      } = await mockAIImageServer();
      onTestFailed(() => close());
      const new_avatar_url = '/rebuild-avatar-in-media-test.png';
      const rebuildPromise = rebuildCharacterAvatar(server, token, cid);

      await tryToCheckRequestCalled(3);
      await resolveRequest({ image_url: new_avatar_url });
      await waitingCharacterAvatarGen(
        server, token, character.id, new_avatar_url
      );
      await rebuildPromise;

      const updated_images = await listCharacterImageStats(server, token);
      expect(updated_images).toHaveLength(1);
      expect(updated_images[0]).toHaveProperty('count', 2);
      expect(updated_images[0]).toHaveProperty('cover', expect.stringContaining(new_avatar_url));
      expect(updated_images[0].character).toHaveProperty('id', character.id);

      await close();
    }
  );

  test.todo('session image should in media folder');
});

describe('image generation', () => {
  test(
    'task create and complete',
    async ({
      server, token, avatar_url,
      character, character_image_gen_random_settings
    }) => {
      const character_image = 'character-image-gen-test.png';

      await waitingCharacterAvatarGen(
        server, token, character.id, avatar_url
      );
      const images = await listCharacterImageStats(server, token);
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveProperty('count', 1);

      const {
        tryToCheckRequestCalled, resolveRequest, close
      } = await mockAIImageServer();
      onTestFailed(() => close());

      const task = await createCharacterImageGenTask(
        server, token,
        character.id,
        character_image_gen_random_settings
      );
      expect(task).toHaveProperty('id', expect.any(String));

      const pendingTask = await getCharacterImageGenTaskResult(
        server, token, character.id, task.id,
      );
      isImageGenTask(pendingTask, { status: 'pending' });
      const listPendingTasks = await listCharacterImageGenTasks(
        server, token, character.id
      );
      expect(listPendingTasks).toBeInstanceOf(Array);
      expect(listPendingTasks).toHaveLength(1);
      isImageGenTaskSummary(listPendingTasks[0], { status: 'pending' });

      await tryToCheckRequestCalled();
      await resolveRequest({ image_url: character_image });


      const completedTask = await waitingExpectToBeTrue(
        () =>  getCharacterImageGenTaskResult(
          server, token, character.id, task.id,
        ),
        (result) => {
          isImageGenTask(result, { status: 'completed' });
        }
      );
      expect(completedTask.asset)
      .toHaveProperty('url', expect.stringContaining(character_image));
      await close();

      const listNoCompletedTasks = await listCharacterImageGenTasks(
        server, token, character.id
      );
      expect(listNoCompletedTasks).toBeInstanceOf(Array);
      expect(listNoCompletedTasks).toHaveLength(0);


      const updated_images = await listCharacterImageStats(server, token);
      expect(updated_images).toHaveLength(1);
      expect(updated_images[0]).toHaveProperty('count', 2);
      expect(updated_images[0]).toHaveProperty('cover', expect.stringContaining(character_image));
      expect(updated_images[0].cover).toMatch(/^http/);
      expect(updated_images[0].character).toHaveProperty('id', character.id);
    }
  );

  test(
    'image generation retry skips deduction and returns already_completed',
    async ({
      server, token, avatar_url,
      character, character_image_gen_random_settings
    }) => {
      await waitingCharacterAvatarGen(
        server, token, character.id, avatar_url
      );
      errowsMethods.deductCoinsByImageGen.mockClear();
      const task = await createCharacterImageGenTask(
        server, token,
        character.id,
        character_image_gen_random_settings
      );
      expect(errowsMethods.deductCoinsByImageGen).toHaveBeenCalledTimes(1);
      await waitingExpectToBeTrue(
        () => getCharacterImageGenTaskResult(
          server, token, character.id, task.id,
        ),
        (result) => result.status === 'completed'
      );
      errowsMethods.deductCoinsByImageGen.mockClear();
      const retryRes = await retryCharacterImageGenTask(
        server, token, character.id, task.id
      );
      expect(retryRes).toMatchObject({
        id: task.id,
        already_completed: true
      });
      expect(errowsMethods.deductCoinsByImageGen).not.toHaveBeenCalled();
    }
  );

  test('character images', async ({
    server, token, character,
    character_image_gen_task,
    avatar_url
  }) => {
    const images = await listCharacterImageStats(server, token);
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveProperty('count', 2);

    const characterImages = await listCharacterImages(
      server, token, character.id
    );
    expect(characterImages).toBeInstanceOf(Object);
    expect(characterImages).toHaveProperty('count', 2);

    expect(characterImages).toHaveProperty('data', expect.any(Array));
    expect(characterImages.data).toHaveLength(2);
    characterImages.data.forEach(isAssetImage);

    const [genImage, avatarImage] = characterImages.data;
    expect(genImage).toHaveProperty('id', character_image_gen_task.asset.id);
    expect(avatarImage).toHaveProperty('url', expect.stringContaining(avatar_url));
  });
});

describe('video generation', () => {
  test('create video generation task', async ({
    server, token, character,
    character_image_gen_task
  }) => {
    const videos = await listCharacterVideos(server, token, character.id);
    expect(videos).toBeInstanceOf(Object);
    expect(videos).toHaveProperty('count', 0);
    expect(videos).toHaveProperty('data', expect.any(Array));
    expect(videos.data).toHaveLength(0);

    const mock_video_url = 'generated-video-default.mp4';
    const mock_request_id = 'test-request-id-0001';
    const video_task_res = {
      status: {
        id: mock_request_id,
        status: 'COMPLETED',
        output: { output: mock_video_url }
      }
    };
    const { taskServer, stateServer } = await mockAIVideoTaskServer();

    const image_id = character_image_gen_task.asset.id;
    const videoTask = await createVideoGenerationTask(
      server, token, character.id, image_id
    );
    expect(videoTask).toHaveProperty('id', expect.any(String));

    // first check pending state
    const pendingTask = await getVideoGenerationTask(
      server, token, character.id, videoTask.id
    );
    isVideoGenTask(pendingTask, { status: 'pending', image_id });
    const pendingTasks = await listCharacterVideoTasks(
      server, token, character.id
    );
    expect(pendingTasks).toBeInstanceOf(Array);
    expect(pendingTasks).toHaveLength(1);
    isVideoGenTask(pendingTasks[0], { status: 'pending', image_id });

    // resolve video generation
    await taskServer.resolveRequest({
      request_id: 'test-request-id-for-video-gen-task'
    });
    await taskServer.tryToCheckRequestCalled();
    await stateServer.tryToCheckRequestCalled();

    // check generating state
    const generatingVideoTask = await waitingExpectToBeTrue(
      () => getVideoGenerationTask(server, token, character.id, videoTask.id),
      (task) => isVideoGenTask(task, { status: 'generating' })
    );
    expect(generatingVideoTask).toHaveProperty('image_id', image_id);
    await taskServer.close();

    // check not completed tasks list
    const generatingTasks = await listCharacterVideoTasks(server, token, character.id);
    expect(generatingTasks).toHaveLength(1);
    isVideoGenTask(generatingTasks[0], { status: 'generating', image_id });

    await stateServer.resolveRequest(video_task_res);
    const completedVideoTask = await waitingExpectToBeTrue(
      () => getVideoGenerationTask(server, token, character.id, videoTask.id),
      (task) => {
        isVideoGenTask(task, { status: 'completed' });
      }
    );
    isVideoGenTask(
      completedVideoTask,
      {
        status: 'completed', image_id,
        asset: expect.objectContaining({
          url: expect.stringContaining(mock_video_url)
        })
      }
    );
    await stateServer.close();

    const notCompletedVideoGenTasks = await listCharacterVideoTasks(
      server, token, character.id
    );
    expect(notCompletedVideoGenTasks).toHaveLength(0);

    const updated_videos = await listCharacterVideos(server, token, character.id);
    expect(updated_videos).toHaveProperty('count', 1);
    const video = updated_videos.data[0];
    expect(video).toHaveProperty('url', expect.stringContaining(mock_video_url));
    expect(video).toHaveProperty('cover', expect.stringContaining(image_gen_url));

    const videoSummary = await listCharacterVideoStats(server, token);
    expect(videoSummary).toBeInstanceOf(Array);
    expect(videoSummary).toHaveLength(1);
    videoSummary.forEach(video => isAssetVideoSummary(video, { count: 1 }));
  });

  describe('task failure', () => {
    test(
      'created video task failed',
      async ({ server, token, character }) => {
        await waitingCharacterAvatarGen(
          server, token, character.id, avatar_url
        );

        const { data: [a1] } = await listCharacterImages(
          server, token, character.id
        );

        vi.spyOn(ai, 'createVideoGenTask')
        .mockRejectedValue(new Error('Video generation failed'));

        const { id: tid } = await createVideoGenerationTask(
          server, token, character.id, a1.id
        );

        await waitingExpectToBeTrue(
          () => getVideoGenerationTask(server, token, character.id, tid),
          (task) => {
            isVideoGenTask(task, { status: 'failed' });
          }
        );

        const failedTasks = await listCharacterVideoTasks(
          server, token, character.id
        );
        expect(failedTasks).toHaveLength(1);
        isVideoGenTask(failedTasks[0], { status: 'failed', image_id: a1.id });
      }
    );

    test(
      'video generation failed',
      async ({ server, token, character }) => {
        await waitingCharacterAvatarGen(
          server, token, character.id, avatar_url
        );

        const { data: [a1] } = await listCharacterImages(
          server, token, character.id
        );

        const { taskServer, stateServer } = await mockAIVideoTaskServer();
        taskServer.resolveRequest({
          request_id: 'test-request-id-for-video-gen-task-state'
        });
        stateServer.resolveRequest(
          { status: { error: { error_message: 'Generation failed' } } }
        );

        const { id: tid } = await createVideoGenerationTask(
          server, token, character.id, a1.id
        );

        await taskServer.tryToCheckRequestCalled();
        await stateServer.tryToCheckRequestCalled();

        await waitingExpectToBeTrue(
          () => getVideoGenerationTask(server, token, character.id, tid),
          (task) => {
            isVideoGenTask(task, { status: 'failed' });
          }
        );
      }
    );
  });
});

describe('handle character deletion with media', () => {
  beforeAll(() => {
    vi.spyOn(ai, 'avatarGen').mockResolvedValue({ image_url: avatar_url });
    vi.spyOn(ai, 'createVideoGenTask').mockResolvedValue({ request_id: 'mock_request_id' });
    vi.spyOn(ai, 'waitingVideoTaskComplete')
    .mockResolvedValue({
      video_url: '/video-for-members-tests.mp4',
      result: { status: 'COMPLETED' }
    });
  });

  test(
    'image should not delete with character',
    async ({ server, token }) => {
      const randomCharacter = await createRandomCharacter(server, token);
      await waitingCharacterAvatarGen(
        server, token, randomCharacter.id, avatar_url
      );
      const imageList = await listCharacterImageStats(server, token);
      expect(imageList).toHaveLength(1);
      expect(imageList[0].character).toHaveProperty('id', randomCharacter.id);

      const characterImages = await listCharacterImages(
        server, token, randomCharacter.id
      );
      expect(characterImages).toHaveProperty('count', 1);
      expect(characterImages.data[0]).toHaveProperty('id', expect.any(String));

      // delete character
      await deleteCharacter(server, token, randomCharacter.id);

      // check image still exist
      const updatedImageList = await listCharacterImageStats(server, token);
      expect(updatedImageList).toHaveLength(1);
      expect(updatedImageList[0]).toHaveProperty('count', 1);
      expect(updatedImageList[0].character).toHaveProperty('id', randomCharacter.id);

      const updatedCharacterImages = await listCharacterImages(
        server, token, randomCharacter.id
      );
      expect(updatedCharacterImages).toHaveProperty('count', 1);
      expect(updatedCharacterImages.data[0]).toHaveProperty('id', expect.any(String));
    }
  );

  test(
    'video should not delete with character',
    async ({ server, token }) => {
      const randomCharacter = await createRandomCharacter(server, token);
      await waitingCharacterAvatarGen(
        server, token, randomCharacter.id, avatar_url
      );

      const characterImages = await listCharacterImages(
        server, token, randomCharacter.id
      );
      expect(characterImages).toHaveProperty('count', 1);
      const image_asset = characterImages.data[0];
      expect(image_asset).toHaveProperty('id', expect.any(String));

      await characterGenVideo(
        server, token,
        randomCharacter.id, image_asset.id
      );

      const videoList = await listCharacterVideoStats(server, token);
      expect(videoList).toHaveLength(1);
      expect(videoList[0].character).toHaveProperty('id', randomCharacter.id);

      const characterVideos = await listCharacterVideos(
        server, token, randomCharacter.id
      );
      expect(characterVideos).toHaveProperty('count', 1);
      expect(characterVideos.data[0]).toHaveProperty('id', expect.any(String));

      // delete character
      await deleteCharacter(server, token, randomCharacter.id);

      // check video still exist
      const updatedVideoList = await listCharacterVideoStats(server, token);
      expect(updatedVideoList).toHaveLength(1);
      expect(updatedVideoList[0]).toHaveProperty('count', 1);
      expect(updatedVideoList[0].character).toHaveProperty('id', randomCharacter.id);

      const updatedCharacterVideos = await listCharacterVideos(
        server, token, randomCharacter.id
      );
      expect(updatedCharacterVideos).toHaveProperty('count', 1);
      expect(updatedCharacterVideos.data[0]).toHaveProperty('id', expect.any(String));
    }
  );
});

describe('images & video list', () => {
  beforeAll(() => {
    vi.spyOn(ai, 'createVideoGenTask').mockResolvedValue({ request_id: 'mock_request_id' });
    vi.spyOn(ai, 'waitingVideoTaskComplete')
    .mockResolvedValue({
      video_url: '/video-for-members-tests.mp4',
      result: { status: 'COMPLETED' }
    });
  });

  describe('sort', () => {
    test(
      'count',
      async ({ server, token, character_image_gen_random_settings }
      ) => {
        const c1 = await createRandomCharacter(server, token);
        const c2 = await createRandomCharacter(server, token);
        await waitingCharacterAvatarGen(
          server, token, c1.id, avatar_url
        );
        await waitingCharacterAvatarGen(
          server, token, c2.id, avatar_url
        );

        // generate images for c1
        await characterGenImage(
          server, token, c1.id, character_image_gen_random_settings
        );

        const imageStatsList = await listCharacterImageStats(
          server, token, { sort: 'count' }
        );
        expect(imageStatsList).toHaveLength(2);

        const [first, second] = imageStatsList;
        expect(first).toHaveProperty('count', 2);
        expect(second).toHaveProperty('count', 1);

        const { data: [c1_a1, c1_a2] } = await listCharacterImages(
          server, token, c1.id
        );
        const { data: [c2_a1] } = await listCharacterImages(
          server, token, c2.id
        );
        await characterGenVideo(server, token, c1.id, c1_a1.id);
        await characterGenVideo(server, token, c1.id, c1_a2.id);
        await characterGenVideo(server, token, c2.id, c2_a1.id);

        const videoStatsList = await listCharacterVideoStats(
          server, token, { sort: 'count' }
        );
        expect(videoStatsList).toHaveLength(2);
        const [vFirst, vSecond] = videoStatsList;
        expect(vFirst).toHaveProperty('count', 2);
        expect(vSecond).toHaveProperty('count', 1);

        await deleteCharacter(server, token, c1.id);
        await deleteCharacter(server, token, c2.id);
      }
    );

    test(
      'latest',
      async ({ server, token }
      ) => {
        const c1 = await createRandomCharacter(server, token);
        const c2 = await createRandomCharacter(server, token);
        await waitingCharacterAvatarGen(
          server, token, c1.id, avatar_url
        );
        await waitingCharacterAvatarGen(
          server, token, c2.id, avatar_url
        );

        const imageStatsList = await listCharacterImageStats(
          server, token, { sort: 'created_at' }
        );
        expect(imageStatsList).toHaveLength(2);

        const [first, second] = imageStatsList;
        expect(first.character).toHaveProperty('id', c2.id);
        expect(second.character).toHaveProperty('id', c1.id);

        const { data: [c1_a1] } = await listCharacterImages(
          server, token, c1.id
        );
        const { data: [c2_a1] } = await listCharacterImages(
          server, token, c2.id
        );
        await characterGenVideo(server, token, c1.id, c1_a1.id);
        await characterGenVideo(server, token, c2.id, c2_a1.id);

        const videoStatsList = await listCharacterVideoStats(
          server, token, { sort: 'created_at' }
        );
        expect(videoStatsList).toHaveLength(2);
        const [vFirst, vSecond] = videoStatsList;
        expect(vFirst.character).toHaveProperty('id', c2.id);
        expect(vSecond.character).toHaveProperty('id', c1.id);

        await deleteCharacter(server, token, c1.id);
        await deleteCharacter(server, token, c2.id);
      }
    );

    test(
      'alphabetical',
      async ({ server, token }
      ) => {
        const c1 = await createRandomCharacter(server, token, { nickname: 'Alice' });
        const c2 = await createRandomCharacter(server, token, { nickname: 'Bob' });
        await waitingCharacterAvatarGen(
          server, token, c1.id, avatar_url
        );
        await waitingCharacterAvatarGen(
          server, token, c2.id, avatar_url
        );

        const imageStatsList = await listCharacterImageStats(
          server, token, { sort: 'alphabetical' }
        );
        expect(imageStatsList).toHaveLength(2);

        const [first, second] = imageStatsList;
        expect(first.character).toHaveProperty('id', c1.id);
        expect(second.character).toHaveProperty('id', c2.id);

        const { data: [c1_a1] } = await listCharacterImages(
          server, token, c1.id
        );
        const { data: [c2_a1] } = await listCharacterImages(
          server, token, c2.id
        );
        await characterGenVideo(server, token, c1.id, c1_a1.id);
        await characterGenVideo(server, token, c2.id, c2_a1.id);

        const videoStatsList = await listCharacterVideoStats(
          server, token, { sort: 'alphabetical' }
        );
        expect(videoStatsList).toHaveLength(2);
        const [vFirst, vSecond] = videoStatsList;
        expect(vFirst.character).toHaveProperty('id', c1.id);
        expect(vSecond.character).toHaveProperty('id', c2.id);

        await deleteCharacter(server, token, c1.id);
        await deleteCharacter(server, token, c2.id);
      }
    );
  });

  describe('tags & search', () => {
    test(
      'search',
      async ({ server, token }) => {
        const c1 = await createRandomCharacter(server, token, { nickname: 'Charlie' });
        const c2 = await createRandomCharacter(server, token, { nickname: 'David' });
        await waitingCharacterAvatarGen(
          server, token, c1.id, avatar_url
        );
        await waitingCharacterAvatarGen(
          server, token, c2.id, avatar_url
        );

        const imageStatsList = await listCharacterImageStats(
          server, token, { q: 'char' }
        );
        expect(imageStatsList).toHaveLength(1);

        const [first] = imageStatsList;
        expect(first.character).toHaveProperty('id', c1.id);
        expect(first.character).toHaveProperty('nickname', 'Charlie');

        const { data: [c1_a1] } = await listCharacterImages(
          server, token, c1.id
        );
        const { data: [c2_a1] } = await listCharacterImages(
          server, token, c2.id
        );
        await characterGenVideo(server, token, c1.id, c1_a1.id);
        await characterGenVideo(server, token, c2.id, c2_a1.id);

        const videoStatsList = await listCharacterVideoStats(
          server, token, { q: 'char' }
        );
        expect(videoStatsList).toHaveLength(1);
        const [vFirst] = videoStatsList;
        expect(vFirst.character).toHaveProperty('id', c1.id);

        await deleteCharacter(server, token, c1.id);
        await deleteCharacter(server, token, c2.id);
      }
    );

    test(
      'gender',
      async ({ server, token, }) => {
        const c1 = await createRandomCharacter(server, token, { gender: 'Male' });
        const c2 = await createRandomCharacter(server, token, { gender: 'Female' });
        await waitingCharacterAvatarGen(
          server, token, c1.id, avatar_url
        );
        await waitingCharacterAvatarGen(
          server, token, c2.id, avatar_url
        );

        const imageStatsList = await listCharacterImageStats(
          server, token, { filters: [['gender', ['Female']]] }
        );
        expect(imageStatsList).toHaveLength(1);
        const [first] = imageStatsList;
        expect(first.character).toHaveProperty('id', c2.id);
        expect(first.character).toHaveProperty('gender', 'Female');

        const { data: [c1_a1] } = await listCharacterImages(
          server, token, c1.id
        );
        const { data: [c2_a1] } = await listCharacterImages(
          server, token, c2.id
        );
        await characterGenVideo(server, token, c1.id, c1_a1.id);
        await characterGenVideo(server, token, c2.id, c2_a1.id);

        const videoStatsList = await listCharacterVideoStats(
          server, token, { filters: [['gender', ['Female']]] }
        );
        expect(videoStatsList).toHaveLength(1);
        const [vFirst] = videoStatsList;
        expect(vFirst.character).toHaveProperty('id', c2.id);
        expect(vFirst.character).toHaveProperty('gender', 'Female');

        await deleteCharacter(server, token, c1.id);
        await deleteCharacter(server, token, c2.id);
      }
    );

    test(
      'futa',
      async ({ server, token, }) => {
        const c1 = await createRandomCharacter(server, token, { tags: ['Female'] });
        const c2 = await createRandomCharacter(server, token, { tags: ['Futa', 'Hentai'] });
        await waitingCharacterAvatarGen(
          server, token, c1.id, avatar_url
        );
        await waitingCharacterAvatarGen(
          server, token, c2.id, avatar_url
        );

        const imageStatsList = await listCharacterImageStats(
          server, token, { filters: [['tags', ['Futa']]] }
        );
        expect(imageStatsList).toHaveLength(1);
        const [first] = imageStatsList;
        expect(first.character).toHaveProperty('id', c2.id);

        const { data: [c1_a1] } = await listCharacterImages(
          server, token, c1.id
        );
        const { data: [c2_a1] } = await listCharacterImages(
          server, token, c2.id
        );
        await characterGenVideo(server, token, c1.id, c1_a1.id);
        await characterGenVideo(server, token, c2.id, c2_a1.id);

        const videoStatsList = await listCharacterVideoStats(
          server, token, { filters: [['tags', ['Futa']]] }
        );
        expect(videoStatsList).toHaveLength(1);
        const [vFirst] = videoStatsList;
        expect(vFirst.character).toHaveProperty('id', c2.id);

        await deleteCharacter(server, token, c1.id);
        await deleteCharacter(server, token, c2.id);
      }
    );

    test(
      'status',
      async ({ server, token, }) => {
        const c1 = await createRandomCharacter(server, token);
        const c2 = await createRandomCharacter(server, token);
        await waitingCharacterAvatarGen(
          server, token, c1.id, avatar_url
        );
        await waitingCharacterAvatarGen(
          server, token, c2.id, avatar_url
        );

        const { data: [c1_a1] } = await listCharacterImages(
          server, token, c1.id
        );
        const { data: [c2_a1] } = await listCharacterImages(
          server, token, c2.id
        );
        await characterGenVideo(server, token, c1.id, c1_a1.id);
        await characterGenVideo(server, token, c2.id, c2_a1.id);

        await deleteCharacter(server, token, c2.id);

        const imageStatsList = await listCharacterImageStats(
          server, token, { status: 'deleted' }
        );
        expect(imageStatsList).toHaveLength(1);
        const [first] = imageStatsList;
        expect(first.character).toHaveProperty('id', c2.id);

        const videoStatsList = await listCharacterVideoStats(
          server, token, { status: 'deleted' }
        );
        expect(videoStatsList).toHaveLength(1);
        const [vFirst] = videoStatsList;
        expect(vFirst.character).toHaveProperty('id', c2.id);

        await deleteCharacter(server, token, c1.id);
      }
    );
  });

  describe('single character images & video', () => {
    test(
      'images sort by created_at',
      async ({
        server, token, avatar_url, character,
        character_image_gen_random_settings
      }) => {
        await waitingCharacterAvatarGen(
          server, token, character.id, avatar_url
        );

        await characterGenImage(
          server, token,
          character.id, character_image_gen_random_settings
        );

        const characterImagesAsc = await listCharacterImages(
          server, token, character.id, { sort: 'created_at', order: 'asc' }
        );
        expect(characterImagesAsc.data).toHaveLength(2);
        const [firstAsc, secondAsc] = characterImagesAsc.data;
        expect(new Date(firstAsc.created_at).getTime())
        .toBeLessThan(new Date(secondAsc.created_at).getTime());

        const characterImagesDesc = await listCharacterImages(
          server, token, character.id, { sort: 'created_at', order: 'desc' }
        );
        expect(characterImagesDesc.data).toHaveLength(2);
        const [firstDesc, secondDesc] = characterImagesDesc.data;
        expect(new Date(firstDesc.created_at).getTime())
        .toBeGreaterThan(new Date(secondDesc.created_at).getTime());
      }
    );

    test(
      'video sort by created_at',
      async ({
        server, token, avatar_url, character,
        character_image_gen_random_settings
      }) => {
        await waitingCharacterAvatarGen(
          server, token, character.id, avatar_url
        );

        await characterGenImage(
          server, token,
          character.id, character_image_gen_random_settings
        );

        const { data: [a1, a2] } = await listCharacterImages(
          server, token, character.id
        );
        await characterGenVideo(server, token, character.id, a1.id);
        await characterGenVideo(server, token, character.id, a2.id);

        const characterVideosAsc = await listCharacterVideos(
          server, token, character.id, { sort: 'created_at', order: 'asc' }
        );
        expect(characterVideosAsc.data).toHaveLength(2);
        const [vFirstAsc, vSecondAsc] = characterVideosAsc.data;
        expect(new Date(vFirstAsc.created_at).getTime())
        .toBeLessThan(new Date(vSecondAsc.created_at).getTime());

        const characterVideosDesc = await listCharacterVideos(
          server, token, character.id, { sort: 'created_at', order: 'desc' }
        );
        expect(characterVideosDesc.data).toHaveLength(2);
        const [vFirstDesc, vSecondDesc] = characterVideosDesc.data;
        expect(new Date(vFirstDesc.created_at).getTime())
        .toBeGreaterThan(new Date(vSecondDesc.created_at).getTime());
      }
    );
  });
});

describe('delete media', () => {
  test(
    'delete character image',
    async ({
      server, token, character,
      character_image_gen_task
    }) => {
      // Verify initial state
      const initialImages = await listCharacterImages(
        server, token, character.id
      );
      expect(initialImages).toHaveProperty('count', 2); // avatar + generated image

      const initialStats = await listCharacterImageStats(server, token);
      expect(initialStats).toHaveLength(1);
      expect(initialStats[0]).toHaveProperty('count', 2);

      // Delete the generated image
      const imageToDelete = character_image_gen_task.asset;
      await deleteCharacterImage(
        server, token, character.id, imageToDelete.id
      );

      // Verify image is deleted from list
      const updatedImages = await listCharacterImages(
        server, token, character.id
      );
      expect(updatedImages).toHaveProperty('count', 1); // only avatar left
      expect(updatedImages.data).toHaveLength(1);
      expect(updatedImages.data[0].id).not.toBe(imageToDelete.id);

      const updatedStats = await listCharacterImageStats(server, token);
      expect(updatedStats).toHaveLength(1);
      expect(updatedStats[0]).toHaveProperty('count', 1); // only avatar left
    }
  );

  test(
    'delete character video',
    async ({ server, token, character, character_image_gen_task }) => {
      // Use the existing image from the fixture
      const image_asset = character_image_gen_task.asset;

      // Generate a video
      const videoTask = await characterGenVideo(
        server, token,
        character.id, image_asset.id
      );

      // Verify initial state
      const initialVideos = await listCharacterVideos(
        server, token, character.id
      );
      expect(initialVideos).toHaveProperty('count', 1);
      expect(initialVideos.data).toHaveLength(1);

      const initialStats = await listCharacterVideoStats(server, token);
      expect(initialStats).toHaveLength(1);
      expect(initialStats[0]).toHaveProperty('count', 1);

      // Delete the video
      const videoToDelete = videoTask.asset;
      await deleteCharacterVideo(
        server, token, character.id, videoToDelete.id
      );

      // Verify video is deleted from list
      const updatedVideos = await listCharacterVideos(
        server, token, character.id
      );
      expect(updatedVideos).toHaveProperty('count', 0);
      expect(updatedVideos.data).toHaveLength(0);

      const updatedStats = await listCharacterVideoStats(server, token);
      expect(updatedStats).toHaveLength(0);
    }
  );

  test(
    'cannot delete other user\'s image',
    async ({ server, character_image_gen_task }) => {
      const { token: otherUserToken } = await createRandomUser(server);

      const imageToDelete = character_image_gen_task.asset;

      // Attempt to delete should fail
      await expect(
        deleteCharacterImage(
          server, otherUserToken,
          character_image_gen_task.cid, imageToDelete.id
        )
      ).rejects.toThrow();
    }
  );

  test(
    'cannot delete other user\'s video',
    async ({ server, token, character, character_image_gen_task }) => {
      const image_asset = character_image_gen_task.asset;

      const videoTask = await characterGenVideo(
        server, token,
        character.id, image_asset.id
      );

      const { token: otherUserToken } = await createRandomUser(server);

      // Attempt to delete should fail
      await expect(
        deleteCharacterVideo(
          server, otherUserToken,
          character.id, videoTask.asset.id
        )
      ).rejects.toThrow();
    }
  );
});

function isAssetImageSummary(summary) {
  expect(summary).toHaveProperty('character', expect.any(Object));
  isCharacterSummary(summary.character);
  expect(summary).toHaveProperty('cover', expect.any(String));
  expect(summary.cover).toMatch(/^http/);
  expect(summary).toHaveProperty('count', expect.any(Number));
}

function isAssetVideoSummary(summary, expected = {}) {
  expect(summary).toHaveProperty('character', expect.any(Object));
  isCharacterSummary(summary.character);
  expect(summary).toHaveProperty('cover', expect.any(String));
  expect(summary.cover).toMatch(/^http/);
  expect(summary).toHaveProperty('count', expect.any(Number));
  expect(summary).toMatchObject(expected);
}

function isCharacterSummary(character) {
  expect(character).toHaveProperty('id', expect.any(String));
  expect(character).toHaveProperty('nickname', expect.any(String));
  expect(character).toHaveProperty('avatar_url');
  expect(character).toHaveProperty('gender', expect.any(String));
}

function isAsset(asset) {
  expect(asset).toBeInstanceOf(Object);
  expect(asset).toHaveProperty('id', expect.any(String));
  expect(asset).toHaveProperty('url', expect.any(String));
  expect(asset.url).toMatch(/^http/);
  expect(asset).toHaveProperty('created_at', expect.any(String));
}
function isAssetImage(image_asset) {
  isAsset(image_asset);
}

function isAssetVideo(video_asset) {
  isAsset(video_asset);
  expect(video_asset).toHaveProperty('cover', expect.any(String));
  expect(video_asset.cover).toMatch(/^http/);
}

function isImageGenTask(task, expected = {}) {
  expect(task).toBeInstanceOf(Object);
  expect(task).toHaveProperty('id', expect.any(String));
  expect(task).toHaveProperty(
    'status',
    expect.toBeOneOf(['pending', 'generating', 'completed', 'failed'])
  );
  if (expected.status) {
    expect(task.status).toBe(expected.status);
  }

  if (task.status === 'completed') {
    expect(task).toHaveProperty('asset', expect.any(Object));
    isAsset(task.asset);
  } else {
    expect(task).toHaveProperty('asset', null);
  }
}

function isImageGenTaskSummary(task) {
  expect(task).toBeInstanceOf(Object);
  expect(task).toHaveProperty('id', expect.any(String));
  expect(task).toHaveProperty(
    'status',
    expect.toBeOneOf(['pending', 'generating', 'failed'])
  );
}

function isVideoGenTask(task, expected = {}) {
  expect(task).toBeInstanceOf(Object);
  expect(task).toHaveProperty('id', expect.any(String));
  expect(task).toHaveProperty('image_id', expect.any(String));
  expect(task).toHaveProperty('cover', expect.any(String));
  expect(task.cover).toMatch(/^http/);
  expect(task).toHaveProperty(
    'status',
    expect.toBeOneOf(['pending', 'generating', 'completed', 'failed'])
  );

  expect(task).toMatchObject(expected);

  if (task.status === 'completed') {
    expect(task).toHaveProperty('asset', expect.any(Object));
    isAssetVideo(task.asset);
    expect(task.asset).toHaveProperty('id', task.id);
    expect(task.asset).toHaveProperty('cover', expect.stringContaining(task.cover));
  }
}
