import {
  CHARACTER_CREATE_OPTION,
  CHARACTER_MODEL_PARAM,
  CHARACTER_MODEL_PARAMS,
  CHARACTER_SETTING
} from "@errows/types";

type MODEL_SETTING = {
  prompt: string;
  base_prompt: string;
  base_model: string;
  lora: [name: string, strength: number];
}

export type BUILD_CHARACTER_MODEL_PARAMS_OPTION = CHARACTER_CREATE_OPTION & {
  options: (
    CHARACTER_CREATE_OPTION['options'][0] & {
      settings: Partial<MODEL_SETTING>
    }
  )[];
}

export function buildModelParams(
  options: BUILD_CHARACTER_MODEL_PARAMS_OPTION[],
  character_settings: CHARACTER_SETTING
): CHARACTER_MODEL_PARAM[] {
  return options.reduce<CHARACTER_MODEL_PARAM[]>(
    (acc, { key, depends, options }) => {
      const satisfyDepend = (depends.length === 0) || depends.every(
        ([d_key, d_values]) => {
          const valueSet = new Set(
            ([] as string[]).concat(character_settings[d_key] ?? [])
          );
          return d_values.some(v => valueSet.has(v));
        }
      );

      if (!satisfyDepend) {
        return acc;
      }

      const value = character_settings[key];
      if (value === undefined) {
        return acc;
      }
      const param = {
        key, value,
        prompt: [], base_prompt: [],
        base_model: [], lora: [],
      } as CHARACTER_MODEL_PARAM & {
        prompt: string[];
        base_prompt: string[];
        base_model: string[];
        lora: [name: string, strength: number][];
      };
      acc.push(param);

      if (Array.isArray(value)) {
        return acc;
      }

      for (const option of options) {
        if (option.value !== value) {
          continue;
        }

        const settings = option.settings;
        if (settings.base_model) {
          param.base_model.push(settings.base_model);
        }

        if (settings.lora) {
          param.lora.push(settings.lora);
        }

        if ((settings.base_prompt ?? '') !== '') {
          param.base_prompt.push(settings.base_prompt as string);
        }

        if ((settings.prompt ?? '') !== '') {
          param.prompt.push(settings.prompt as string);
        }
      }

      return acc;
    },
    []
  )
  .map(omitEmptyArrayKey);
}

function omitEmptyArrayKey(params: CHARACTER_MODEL_PARAM): CHARACTER_MODEL_PARAM {
  const { key, value, prompt, base_prompt, base_model, lora } = params;
  const res = { key, value };
  if ((prompt?.length ?? 0) > 0) {
    Object.assign(res, { prompt });
  }
  if ((base_prompt?.length ?? 0) > 0) {
    Object.assign(res, { base_prompt });
  }
  if ((base_model?.length ?? 0)> 0) {
    Object.assign(res, { base_model });
  }
  if ((lora?.length ?? 0) > 0) {
    Object.assign(res, { lora });
  }
  return res;
}

const characterSettingToModelParamsMap: Record<string, string | null> = {
  voice: null,
  tags: 'tag',

  introduction: null,
  nickname: 'character',
  settings: 'description',
  gender: 'charactergender',
  type: 'is_anime',

  greeting: null,
  personality: 'personality',
  scenario: 'scenario',
  conversation: 'dialogue',
};

export function convert2ApiParams(
  { params, params_override }: CHARACTER_MODEL_PARAMS
): CHARACTER_API_PARAM {
  const apiParams = buildDefaultModelParams();

  const res =  params.reduce<CHARACTER_API_PARAM>(
    (acc, { key, value, prompt, base_prompt, base_model, lora }) => {
      if ((base_model?.length ?? 0) > 0) {
        const data = (base_model as string[])[0];
        Object.assign(acc, { base_model: data });
      }

      for (const [name, strength] of (lora ?? [])) {
        acc.lora.push(name);
        acc.lora_strength.push(strength);
      }

      if ((base_prompt?.length ?? 0) > 0) {
        const concatPrompt = (acc.base_prompt ? [acc.base_prompt] : [])
        .concat(base_prompt as string[])
        .join(', ');
        Object.assign(acc, { base_prompt: concatPrompt });
      }

      if (key === 'tags') {
        const concatPrompt = (acc.base_prompt ? [acc.base_prompt] : [])
        .concat(value)
        .join(', ');
        Object.assign(acc, { base_prompt: concatPrompt });
      }

      if (key === 'type') {
        Object.assign(
          acc,
          { is_anime: ((value as string).toLocaleLowerCase() === 'anime') }
        );
        return acc;
      }

      if (key === 'personality') {
        const personality = acc.personality.concat(value);
        Object.assign(acc, { personality });
        return acc;
      }

      const convertKey = characterSettingToModelParamsMap[key];
      if (convertKey === null) {
        return acc;
      }

      const promptValue = (prompt?.length ?? 0) > 0
        ? (prompt as string[]).join(', ')
        : value;

      // default append to body array
      if (convertKey === undefined) {
        if (promptValue !== '') {
          acc.base_prompt += `,${(promptValue as string)}`;
        }
        return acc;
      }

      Object.assign(acc, { [convertKey]: value });
      return acc;
    },
    apiParams
  );

  return Object.assign(res, params_override);
}

export interface CHARACTER_API_PARAM {
  is_anime: boolean;
  is_manual: boolean;

  charactergender: string;
  face: string;
  body: string[];

  character: string;
  description: string;
  persona: string;
  personality: string[];

  outfit: string;
  action: string;
  genre: string;
  tag: string[];

  // next line is a typo for purposely: background
  bacground: string;
  scenario: string;

  dialogue: { user: string, character: string }[];
  system: string;
  user: string;

  base_model: string;
  lora: string[];
  lora_strength: number[];
  base_prompt: string;
}

export function buildDefaultModelParams(): CHARACTER_API_PARAM {
  return {
    is_anime: true,
    is_manual: true,

    charactergender: '',
    face: '',
    body: [],

    character: '',
    description: '',
    persona: '',
    personality: [],
    bacground: '',
    scenario: '',
    tag: [],

    outfit: '',
    action: '',
    genre: '',

    dialogue: [],
    system: '',
    user: '',

    base_model: '',
    lora: [],
    lora_strength: [],
    base_prompt: ''
  };
}