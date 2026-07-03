import path from 'node:path';
import {
  CHARACTER_SETTING,
  CHARACTER_CREATE_OPTION,
  CHARACTER_IMAGE_GEN_STEP,
  CHARACTER_IMAGE_GEN_OPTION,
  CHARACTER_IMAGE_GEN_SETTING,
  CHARACTER_MODEL_PARAMS
} from '@errows/types';
import { postJSON } from './json';
import { pushLLMDebugPayload } from './debug-sink';
import { SERVICE_SETTINGS } from './types';
import {
  BUILD_CHARACTER_MODEL_PARAMS_OPTION,
  buildModelParams,
  convert2ApiParams,
} from './model';


export async function avatarGen(
  service_settings: SERVICE_SETTINGS,
  options: CHARACTER_CREATE_OPTION[],
  character_params: CHARACTER_SETTING & CHARACTER_MODEL_PARAMS,
): Promise<{ image_url: string }> {
  const { endpoint, apiKey } = service_settings;

  const params = character_params.params
    ? character_params.params
    : buildModelParams(
      options as BUILD_CHARACTER_MODEL_PARAMS_OPTION[],
      character_params
    );

  const image_model_settings = convert2ApiParams({ ...character_params, params });

  const {
    is_anime, is_manual,
    outfit, action, bacground,
    base_model, base_prompt,
    lora, lora_strength,
    ...character_setting
  } = image_model_settings;
  const body = {
    key: apiKey,
    is_anime, is_manual,
    outfit, action, bacground,
    character_setting,
    character_image_model: {
      base_model, base_prompt,
      lora, lora_strength
    }
  }
  pushLLMDebugPayload('image', body);

  const res = await postJSON<{
    image_url: string
  }>(endpoint, { body });

  if (!res.image_url) {
    const error = new Error('Image generation failed.');
    Object.assign(error, { res: JSON.stringify(res) });
    throw error;
  }

  return { image_url: res.image_url };
}

function randomChoice<T>(arr: T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx] as T;
}

type step_options_map = Record<
  CHARACTER_IMAGE_GEN_OPTION['value'],
  CHARACTER_IMAGE_GEN_OPTION
>
type step_prompt_map = Record<CHARACTER_IMAGE_GEN_STEP['key'], step_options_map>

function buildStepPromptMap(
  gender: 'female' | 'male',
  steps: CHARACTER_IMAGE_GEN_STEP[]
): step_prompt_map {
  return steps.reduce<step_prompt_map>(
    (acc, step) => {
      if (step.gender !== gender.toLocaleLowerCase()) {
        return acc;
      }

      if (acc[step.key] === undefined) {
        Object.assign(acc, { [step.key]: {} });
      }

      const options = step.options.reduce((acc, option) => {
        Object.assign(acc, { [option.value]: option });
        return acc;
      }, acc[step.key] as step_options_map);

      return Object.assign(acc, { [step.key]: options });
    },
    {}
  );
}

function randomPrompt(
  optionMap: Record<
    CHARACTER_IMAGE_GEN_OPTION['value'],
    CHARACTER_IMAGE_GEN_OPTION
  >,
  value: string,
): string {
  const prompts = optionMap[value]?.prompts ?? [];
  return randomChoice(prompts);
}

type MANUAL_PROMPT_PARAM =
| {
  bacground: string;
  outfit: string;
  action: string;
}
| { prompt: string };

export async function buildExtractImageParams(
  gender: 'female' | 'male',
  steps: CHARACTER_IMAGE_GEN_STEP[],
  settings: CHARACTER_IMAGE_GEN_SETTING,
) {
  if (settings.prompt) {
    return { prompt: settings.prompt } as MANUAL_PROMPT_PARAM;
  }

  const paramsMap = buildStepPromptMap(gender, steps);

  const background = settings.background.map(
    bg => randomPrompt(paramsMap['background'] ?? {}, bg)
  ).join(', ');
  const outfit = settings.outfit.map(
    of => randomPrompt(paramsMap['outfit'] ?? {}, of)
  ).join(', ');
  const action = settings.action.map(
    ac => randomPrompt(paramsMap['action'] ?? {}, ac)
  ).join(', ');

  return {
    bacground: background,
    outfit,
    action
  } as MANUAL_PROMPT_PARAM;
}

interface AUTO_GEN_PROMPT_PARAMS {
  message_to_gen_prompt: string;
}
function covertAutoGenPromptToExtractImageParams(
  auto_gen_prompt: AUTO_GEN_PROMPT_PARAMS | null = null
) {
  if (auto_gen_prompt === null) {
    return null;
  }

  return {
    history: [],
    is_manual: false,
    response: auto_gen_prompt.message_to_gen_prompt
  }
}

export async function imageGen(
  service_settings: SERVICE_SETTINGS,
  options: CHARACTER_CREATE_OPTION[],
  steps: CHARACTER_IMAGE_GEN_STEP[],
  character_params: CHARACTER_SETTING & CHARACTER_MODEL_PARAMS & { avatar_url: string },
  settings: CHARACTER_IMAGE_GEN_SETTING | null = null,
  auto_gen_prompt_params: AUTO_GEN_PROMPT_PARAMS | null = null
): Promise<{ image_url: string }> {
  const { endpoint, apiKey } = service_settings;

  const params = character_params.params
    ? character_params.params
    : buildModelParams(
      options as BUILD_CHARACTER_MODEL_PARAMS_OPTION[],
      character_params
    );

  const image_model_settings = convert2ApiParams({ ...character_params, params });


  const {
    is_anime, is_manual,
    outfit, action, bacground,
    base_model,
    base_prompt: character_base_prompt,
    lora, lora_strength,
    ...character_setting
  } = image_model_settings;

  let manual_prompt: MANUAL_PROMPT_PARAM | null = null;
  if (settings !== null) {
    manual_prompt = await buildExtractImageParams(
      character_params.gender,
      steps,
      settings
    );
  }

  const base_prompt = (manual_prompt !== null && ('prompt' in manual_prompt))
    ? [character_base_prompt, manual_prompt.prompt].join(', ')
    : character_base_prompt;

  const character_image_model = {
    base_model, base_prompt,
    lora, lora_strength
  };

  const face = path.basename(character_params.avatar_url ?? '');
  const autoGenPromptParams = covertAutoGenPromptToExtractImageParams(
    auto_gen_prompt_params
  );

  const body = Object.assign(
    {
      key: apiKey,
      is_anime, is_manual,
      outfit, action, bacground,
      character_setting,
      character_image_model,
    },
    manual_prompt,
    autoGenPromptParams,
    {
      character_setting: Object.assign(character_setting, { face }),
    }
  );
  pushLLMDebugPayload('image', body);

  const res = await postJSON<{image_url: string}>(endpoint, { body });

  if (!res.image_url) {
    const error = new Error('Image generation failed.');
    Object.assign(error, { res: JSON.stringify(res) });
    throw error;
  }

  return { image_url: res.image_url };
}