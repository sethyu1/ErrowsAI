import { avatarGen, imageGen } from './image';
import { createVideoGenTask, waitingVideoTaskComplete } from './video';
import { chatCompletion, chatCompletionStream, suggestReplyCompletion } from './chat';
import { refineTextCompletion } from './refine';
import { tts, voiceCall } from './tts.js';
import { buildModelParams } from './model';

export { TaskQueue } from './tasks';
export { avatarGen, imageGen } from './image';
export { createVideoGenTask, waitingVideoTaskComplete } from './video';
export { chatCompletion, chatCompletionStream, suggestReplyCompletion } from './chat';
export { refineTextCompletion } from './refine';
export { tts, voiceCall } from './tts.js';
export { buildModelParams } from './model';
export { setLLMDebugSink } from './debug-sink';

export type { VOICE_CALL_EVENT } from './tts';

export default {
  avatarGen,
  imageGen,
  chatCompletion,
  chatCompletionStream,
  suggestReplyCompletion,
  refineTextCompletion,
  createVideoGenTask,
  waitingVideoTaskComplete,
  tts,
  voiceCall,
  buildModelParams
};
