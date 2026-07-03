import { describe, expect, vi } from 'vitest';
import ai from '@errows/ai';
import { isGift, sendSessionMessage } from './fixtures/session.mjs';
import { test, listTasks, taskClaim } from './fixtures/task.mjs';
import { waitingExpectToBeTrue } from './lib/utils.mjs';
import { userProfile } from './fixtures/user.mjs';
import {
  createRandomCharacter, followCharacter
} from './fixtures/character.mjs';
import { characterGenImage } from './fixtures/media.mjs';
import { mockPost, createComment } from './fixtures/post.mjs';
import { getMemberInfo } from './fixtures/user.mjs';
import { mock_ops_service } from './fixtures/ops.mjs';

const avatar_url = '/mock-avatar-for-task-tests.png';

vi.spyOn(ai, 'chatCompletion')
.mockResolvedValue({ reply: 'mock message in task test' });
vi.spyOn(ai, 'avatarGen').mockResolvedValue({ image_url: avatar_url });
vi.spyOn(ai, 'imageGen').mockResolvedValue({ image_url: avatar_url });

const scope = 'task_tests';
test.scoped({
  scope, avatar_url,
  services: ['api', 'user', 'errows', 'payment', mock_ops_service]
});

describe("tasks tests", () => {
  test('list tasks', async ({ server, token }) => {
    const tasks = await listTasks(server, token);
    expect(tasks).toBeInstanceOf(Array);
    tasks.forEach(isTask);
  });

  test('daily login task progress', async ({ server, token, tasks_map }) => {
    const dailyLoginTask = tasks_map.get('daily_login');
    expect(dailyLoginTask).toBeDefined();

    const tasks = await listTasks(server, token);
    const task = tasks.find(t => t.id === dailyLoginTask.id);
    expect(task).toBeDefined();

    expect(task.is_claimed).toBe(false);

    await userProfile(server, token);
    await waitingExpectToBeTrue(
      () => listTasks(server, token),
      (tasks) => {
        const task = tasks.find(t => t.id === dailyLoginTask.id);
        expect(task.is_completed).toBe(true);
        expect(task.progress).toBe(1);
      }
    );

    await taskClaim(server, token, dailyLoginTask.id);

    const tasks_after_claim = await listTasks(server, token);
    const task_after_claim = tasks_after_claim.find(t => t.id === dailyLoginTask.id);
    expect(task_after_claim.is_claimed).toBe(true);

    await expect(taskClaim(server, token, dailyLoginTask.id))
    .rejects.toMatchObject({
      status: 409,
    });
  });

  test('character follow task', async ({ server, token, tasks_map }) => {
    const followTask = tasks_map.get('character_follow');
    expect(followTask).toBeDefined();
    expect(followTask.type).toBe('token');
    expect(followTask.is_completed).toBe(false);
    expect(followTask.is_claimed).toBe(false);

    for (let i = 0; i < followTask.goal; i++) {
      const character = await createRandomCharacter(server, token);
      await followCharacter(server, token, character.id);
    }

    await waitingExpectToBeTrue(
      () => listTasks(server, token),
      (tasks) => {
        const task = tasks.find(t => t.id === followTask.id);
        expect(task.progress).toEqual(followTask.goal);
        expect(task.is_completed).toEqual(true);
      }
    );

    await taskClaim(server, token, followTask.id);

    const tasks_after_claim = await listTasks(server, token);
    const task_after_claim = tasks_after_claim.find(t => t.id === followTask.id);
    expect(task_after_claim.is_claimed).toBe(true);

    await expect(taskClaim(server, token, followTask.id)).rejects
    .toMatchObject({ status: 409 });
  });

  test(
    'character chat task',
    async ({ server, token, session, tasks_map }) => {
      const member = await getMemberInfo(server, token);

      const chatTask = tasks_map.get('character_chat');
      expect(chatTask).toBeDefined();
      expect(chatTask.type).toBe('token');
      expect(chatTask.is_completed).toBe(false);
      expect(chatTask.is_claimed).toBe(false);

      for (let i = 0; i < chatTask.goal; i++) {
        await sendSessionMessage(server, token, session.id, 'Hello');
      }

      await waitingExpectToBeTrue(
        () => listTasks(server, token),
        (tasks) => {
          const task = tasks.find(t => t.id === chatTask.id);
          expect(task.progress).toEqual(chatTask.goal);
          expect(task.is_completed).toEqual(true);
        }
      );

      await taskClaim(server, token, chatTask.id);

      const member_after_claim = await getMemberInfo(server, token);
      expect(member_after_claim.coin_free_balance)
      .toEqual(chatTask.token + member.coin_free_balance);

      const tasks_after_claim = await listTasks(server, token);
      const task_after_claim = tasks_after_claim.find(t => t.id === chatTask.id);
      expect(task_after_claim.is_claimed).toBe(true);

      await expect(taskClaim(server, token, chatTask.id)).rejects
      .toMatchObject({ status: 409 });

      const member_after_duplicate_claim = await getMemberInfo(server, token);
      expect(member_after_duplicate_claim.coin_free_balance)
      .toEqual(member_after_claim.coin_free_balance);
    }
  );

  test(
    'character image generation task',
    async ({
      server, token, tasks_map,
      character, character_random_settings
    }) => {
      const imageGenTask = tasks_map.get('character_image_gen');
      expect(imageGenTask).toBeDefined();
      expect(imageGenTask.type).toBe('token');
      expect(imageGenTask.is_completed).toBe(false);
      expect(imageGenTask.is_claimed).toBe(false);


      for (let i = 0; i < imageGenTask.goal; i++) {
        await characterGenImage(
          server, token,
          character.id, character_random_settings
        );
      }

      await waitingExpectToBeTrue(
        () => listTasks(server, token),
        (tasks) => {
          const task = tasks.find(t => t.id === imageGenTask.id);
          expect(task.progress).toEqual(imageGenTask.goal);
          expect(task.is_completed).toEqual(true);
        }
      );

      const member = await getMemberInfo(server, token);
      await taskClaim(server, token, imageGenTask.id);
      const member_after_claim = await getMemberInfo(server, token);
      expect(member_after_claim.coin_free_balance)
      .toEqual(imageGenTask.token + member.coin_free_balance);

      const tasks_after_claim = await listTasks(server, token);
      const task_after_claim = tasks_after_claim.find(t => t.id === imageGenTask.id);
      expect(task_after_claim.is_claimed).toBe(true);

      const member_after_duplicate_claim = await getMemberInfo(server, token);
      expect(member_after_duplicate_claim.coin_free_balance)
      .toEqual(member_after_claim.coin_free_balance);
    }
  );

  test(
    'task post comment',
    async ({ server, token, tasks_map, character }) => {
      const member = await getMemberInfo(server, token);
      const imageGenTask = tasks_map.get('post_comment');
      expect(imageGenTask).toBeDefined();
      expect(imageGenTask.type).toBe('token');
      expect(imageGenTask.is_completed).toBe(false);
      expect(imageGenTask.is_claimed).toBe(false);

      const post = await mockPost(server, token, character.id);
      for (let i = 0; i < imageGenTask.goal; i++) {
        await createComment(
          server, token, post.id, 'Hello'
        );
      }

      await waitingExpectToBeTrue(
        () => listTasks(server, token),
        (tasks) => {
          const task = tasks.find(t => t.id === imageGenTask.id);
          expect(task.progress).toEqual(imageGenTask.goal);
          expect(task.is_completed).toEqual(true);
        }
      );

      await taskClaim(server, token, imageGenTask.id);
      const member_after_claim = await getMemberInfo(server, token);
      expect(member_after_claim.coin_free_balance)
      .toEqual(imageGenTask.token + member.coin_free_balance);

      const tasks_after_claim = await listTasks(server, token);
      const task_after_claim = tasks_after_claim.find(t => t.id === imageGenTask.id);
      expect(task_after_claim.is_claimed).toBe(true);

      const member_after_duplicate_claim = await getMemberInfo(server, token);
      expect(member_after_duplicate_claim.coin_free_balance)
      .toEqual(member_after_claim.coin_free_balance);
    }
  );
});


function isTask(task) {
  expect(task).toHaveProperty('id', expect.any(String));
  expect(task).toHaveProperty('title', expect.any(String));
  expect(task).toHaveProperty('description', expect.any(String));
  expect(task).toHaveProperty('is_completed', expect.any(Boolean));
  expect(task).toHaveProperty('is_claimed', expect.any(Boolean));
  expect(task).toHaveProperty('progress', expect.any(Number));
  expect(task).toHaveProperty('goal', expect.any(Number));

  expect(task).toHaveProperty('type', expect.stringMatching(/^(token|gift)$/));
  if (task.type === 'token') {
    expect(task).toHaveProperty('token', expect.any(Number));
  } else if (task.type === 'gift') {
    expect(task).toHaveProperty('gift');
    isGift(task.gift);
  }
}