import { expect } from 'vitest';
import { test as baseTest } from './character.mjs';
import { getJSON, postJSON, deleteJSON } from '../lib/api.mjs';
import { waitingExpectToBeTrue } from '../lib/utils.mjs';

function getCharacterImageGenSteps(server, token) {
  return getJSON(
    server, '/characters/images/options',
    { token }
  );
}

export async function genRandomImageGenSettings(
  server, token, gender, steps = null
) {
  if (steps === null) {
    steps = await getCharacterImageGenSteps(server, token);
  }

  const genderLower = gender.toLowerCase();

  return steps.reduce((acc, step) => {
    if (step.gender !== genderLower) {
      return acc;
    }

    const { key, options, min_select, max_select } = step;
    const select_count = Math.floor(
      Math.random() * (max_select - min_select + 1)
    ) + min_select;

    const shuffled_options = options
    .map(({ value }) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

    acc[key] = shuffled_options.slice(0, select_count);

    return acc;
  }, {});
}

export function createCharacterImageGenTask(
  server, token, cid, settings
) {
  return postJSON(
    server,
    `/characters/${cid}/images/tasks`,
    { token, body: settings }
  );
}

export function getCharacterImageGenTaskResult(
  server, token, cid, tid
) {
  return getJSON(
    server, `/characters/${cid}/images/tasks/${tid}`,
    { token }
  );
}

export function retryCharacterImageGenTask(server, token, cid, tid) {
  return postJSON(
    server,
    `/characters/${cid}/images/tasks/${tid}/retry`,
    { token, body: {} }
  );
}

export function listCharacterImageGenTasks(server, token, cid) {
  return getJSON(
    server, `/characters/${cid}/images/tasks`,
    { token }
  );
}

export async function listCharacterImageStats(server, token, query = {}) {
  return getJSON(
    server, '/my/characters/images',
    { token, query }
  );
}

export async function listCharacterImages(server, token, cid, query = {}) {
  return getJSON(
    server, `/my/characters/${cid}/images`,
    { token, query }
  );
}

export async function createVideoGenerationTask(
  server, token, cid, aid
) {
  return postJSON(
    server,
    `/characters/${cid}/images/${aid}/videos/tasks`,
    { token }
  );
}

export async function listCharacterVideoTasks(server, token, cid) {
  return getJSON(
    server, `/characters/${cid}/videos/tasks`,
    { token }
  );
}

export async function listCharacterVideoStats(server, token, query = {}) {
  return getJSON(
    server, '/my/characters/videos',
    { token, query }
  );
}

export async function getVideoGenerationTask(server, token, cid, tid) {
  return getJSON(
    server,
    `/characters/${cid}/videos/tasks/${tid}`,
    { token }
  );
}

export async function listCharacterVideos(server, token, cid, query = {}) {
  return getJSON(
    server, `/my/characters/${cid}/videos`,
    { token, query }
  );
}

export async function characterGenImage(server, token, cid, settings) {
  const task = await createCharacterImageGenTask(
    server, token, cid, settings
  );

  const completedTask = await waitingExpectToBeTrue(
    () =>  getCharacterImageGenTaskResult(
      server, token, cid, task.id,
    ),
    (result) => {
      expect(result).toHaveProperty('status', 'completed');
    }
  );
  return completedTask;
}

export async function characterGenVideo(
  server, token, cid, aid
) {
  const task = await createVideoGenerationTask(
    server, token, cid, aid
  );

  const completedTask = await waitingExpectToBeTrue(
    () => getVideoGenerationTask(server, token, cid, task.id),
    (task) => {
      expect(task).toHaveProperty('status', 'completed');
    }
  );
  return completedTask;
}

export async function deleteCharacterImage(server, token, cid, aid) {
  return deleteJSON(
    server,
    `/my/characters/${cid}/images/${aid}`,
    { token }
  );
}

export async function deleteCharacterVideo(server, token, cid, vid) {
  return deleteJSON(
    server,
    `/my/characters/${cid}/videos/${vid}`,
    { token }
  );
}

export const test = baseTest.extend({
  character_image_gen_steps: async ({ server, token }, use) => {
    await use(getCharacterImageGenSteps(server, token));
  },
  character_image_gen_random_settings: async (
    { server, token, gender, character_image_gen_steps }, use
  ) => {
    const settings = await genRandomImageGenSettings(
      server, token,
      gender, character_image_gen_steps
    );
    await use(settings);
  },
  character_image_gen_task: async (
    { server, token, character, character_image_gen_random_settings },
    use
  ) => {
    const completedTask = await characterGenImage(
      server, token, character.id,
      character_image_gen_random_settings
    );
    await use(completedTask);
  },
});