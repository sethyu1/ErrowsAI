import { postJSON } from "./json";
import { SERVICE_SETTINGS } from "./types";
import { pushLLMDebugPayload } from './debug-sink';


export async function createVideoGenTask(
  service_settings: SERVICE_SETTINGS,
  settings: { image_url: string }
): Promise<{ request_id: string }> {
  const { endpoint, apiKey } = service_settings;
  const { image_url } = settings;

  const body = {
    character_setting:{ face: image_url },
    image_id: 1,
    key: apiKey
  };
  pushLLMDebugPayload('video', body);

  const res = await postJSON<{ request_id: string }>(endpoint, { body });
  if (!res.request_id) {
    throw new Error('Video generation task creation failed.');
  }

  return { request_id: res.request_id };
}

type VIDEO_TASK_RES = {
  status: {
    id: string ,
    workerId: string
    delayTime: number,
  } & (
    | { status: 'FAILED' }
    | { status: 'IN_PROGRESS' }
    | { status: 'IN_QUEUE' }
    | { status: 'COMPLETED', output: { output: string }, executionTime: number }
  )
}

export async function waitingVideoTaskComplete(
  config: { endpoint: string },
  settings: { request_id: string },
  timeout: number = 10 * 60 * 1000
) {
  const { endpoint } = config;

  const res = await postJSON<VIDEO_TASK_RES>(endpoint, { body: settings });

  if (res.status.status === 'COMPLETED') {
    return { video_url: res.status.output.output, result: res };
  }

  if ('error' in res.status) {
    const error = new Error('Video generation task failed.');
    Object.assign(error, { settings, result: JSON.stringify(res) });
    throw error;
  }

  if (timeout <= 0) {
    const error = new Error('Video generation task timeout.');
    Object.assign(error, { settings, result: JSON.stringify(res) });
    throw error;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  return waitingVideoTaskComplete(config, settings, timeout - 1000);
}
