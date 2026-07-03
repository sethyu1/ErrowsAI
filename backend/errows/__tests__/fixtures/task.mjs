import { test as baseTest } from './session.mjs';
import { getJSON, postJSON } from '../lib/api.mjs';

export const test = baseTest.extend({
  tasks_map: async ({ server, token }, use) => {
    const taskConfigs = await listTasks(server, token);
    const map = new Map();
    for (const config of taskConfigs) {
      map.set(config.name, config);
    }
    await use(map);
  }
});

export function listTasks(server, token) {
  return getJSON(server, '/tasks', { token });
}

export function taskClaim(server, token, taskId) {
  return postJSON(server, `/tasks/${taskId}/claim`, { token });
}