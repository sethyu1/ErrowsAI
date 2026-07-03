import { vi } from 'vitest';
import ai from '@errows/ai';
import _ from 'lodash';
import { setupMockJSONServer, setupStreamServer } from './server.mjs';

export async function mockAIImageServer() {
  if (vi.isMockFunction(ai.avatarGen)) {
    ai.avatarGen.mockRestore();
  }
  if (vi.isMockFunction(ai.imageGen)) {
    ai.imageGen.mockRestore();
  }

  const mockServer = await setupMockJSONServer();
  const { endpoint } = mockServer;

  vi.doMock('config', async (importOriginal) => {
    const original = await importOriginal();
    const mock = _.merge(
      {}, original.default,
      _.set({}, `ai.image.endpoint`, endpoint)
    );
    return { default: mock };
  });

  return mockServer;
}

export async function mockAITtsServer() {
  if (vi.isMockFunction(ai.tts)) {
    ai.tts.mockRestore();
  }

  const mockServer = await setupMockJSONServer();
  const { endpoint } = mockServer;

  vi.doMock('config', async (importOriginal) => {
    const original = await importOriginal();
    const mock = _.merge(
      {}, original.default,
      _.set({}, `ai.tts.endpoint`, endpoint)
    );
    return { default: mock };
  });

  return mockServer;
}

export async function mockChatServer() {
  if (vi.isMockFunction(ai.chatCompletion)) {
    ai.chatCompletion.mockRestore();
  }

  const mockServer = await setupMockJSONServer();
  const { endpoint } = mockServer;

  vi.doMock('config', async (importOriginal) => {
    const original = await importOriginal();
    const mock = _.merge(
      {}, original.default,
      _.set({}, `ai.chat.endpoint`, endpoint)
    );
    return { default: mock };
  });

  return mockServer;
}

export async function mockAIVideoTaskServer() {
  if (vi.isMockFunction(ai.createVideoGenTask)) {
    ai.createVideoGenTask.mockRestore();
  }
  if (vi.isMockFunction(ai.waitingVideoTaskComplete)) {
    ai.waitingVideoTaskComplete.mockRestore();
  }
  const stateServer = await setupMockJSONServer();
  const taskServer = await setupMockJSONServer();

  vi.doMock('config', async (importOriginal) => {
    const original = await importOriginal();
    const mock = _.merge(
      {}, original.default,
      _.set({}, `ai.video.video_state`, stateServer.endpoint),
      _.set({}, `ai.video.endpoint`, taskServer.endpoint),
    );
    return { default: mock };
  });

  return {
    stateServer,
    taskServer,
  };
}

export async function mockAIVoiceCallServer() {
  if (vi.isMockFunction(ai.voiceCall)) {
    ai.voiceCall.mockRestore();
  }

  const mockServer = await setupStreamServer();
  const { endpoint } = mockServer;

  vi.doMock('config', async (importOriginal) => {
    const original = await importOriginal();
    const mock = _.merge(
      {}, original.default,
      _.set({}, `ai.voiceCall.endpoint`, endpoint)
    );
    return { default: mock };
  });

  return mockServer;
}