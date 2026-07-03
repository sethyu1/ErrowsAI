import fs from 'fs/promises';
import _ from 'lodash';
import path from 'node:path';

export const command = 'creation [file_path]';
export const describe = 'migrate character creation config from old character settings';
export const builder = {
  file_path: {
    type: 'creation',
    describe: 'Path to the old character settings file',
    default: './static/old.config.json'
  }
};
export async function handler(args) {
  const { file_path } = args;
  const fullPath = path.resolve(process.cwd(), file_path);
  const content = await fs.readFile(fullPath, 'utf-8');
  const oldSettings = (JSON.parse(content)).data;

  const tags = convertTags(oldSettings);
  const newSettings = characterCreateConfig(oldSettings, tags);
  console.log(JSON.stringify(newSettings));
}

function trimComma(str) {
  return str.replace(/^,+|,+$/g, '').trim();
}

const title2KeyMap = {
  "Angel Race": 'race',
  "Angelkin Race": 'race',
  "Beastkin Race": 'race',
  "Character setting": 'introduction',
  "Choose Age": 'age',
  "Choose Assortment": 'assortment',
  "Choose Body Type": 'body_type',
  "Choose Breast Size": 'breast_size',
  "Choose Butt Size": 'butt_size',
  "Choose Eye Color*": 'eye_color',
  "Choose Gender": 'gender',
  "Choose Hair Bangs": 'hair_bangs',
  "Choose Hair Color": 'hair_color',
  "Choose Hair Length": 'hair_length',
  "Choose Hair Style*": 'hair_style',
  "Choose Penis Size": 'penis_size',
  "Choose Style": 'type',
  "Choose Voice": 'voice',
  "Demonkin Race": 'race',
  "Description": 'settings',
  "Dragon Race": 'race',
  "Elf Race": 'race',
  "Example Conversation": 'conversation',
  "Fairy Race": 'race',
  "Furry Race": 'race',
  "Greeting": 'greeting',
  "Human Race": 'race',
  "Name": 'nickname',
  "Personality": 'personality',
  "Scenario": 'scenario',
  "Tags": 'tags',
  "description": 'settings',
  "nickname": 'nickname',
  "scenario": 'scenario'
};

function convertKey(title) {
  if (title2KeyMap[title]) {
    return title2KeyMap[title];
  }

  throw new Error(`Unknown title: ${title}`);
}

function convertTitle(title) {
  if (title === 'Character setting') { return 'Introduction'; }
  if (title === 'description') { return 'Character Setting'; }
  if (title === 'Description') { return 'Character Setting'; }
  return title;
}

const style2typeMap = {
  1: 'image_select_big',
  2: 'image_select',
  3: 'text_select',
  4: 'discrete_sliders',
  5: 'color_select',
  6: 'text_input',
  7: 'dialogue_list',
  8: 'voice_select',
  9: 'long_text_input',
};
function characterCreateConfig(old, tags) {
  const oldSettings = old.character_create_config;

  const valueKeyMap = {};

  let tags_step = null;

  const options = oldSettings
  .filter(setting => setting.show !== 0)
  .reduce(
    (acc, setting) => {
      const {
        category: sex, name: title, style,
        must_choose, multiple, list
      } = setting;

      const oldKey = trimComma(setting.key);
      const newKey = convertKey(title);
      const newTitle = convertTitle(title);

      const depends = [];
      if (sex) {
        depends.push(['gender', [sex]]);
      }

      if (valueKeyMap[oldKey]) {
        const { key, value } = valueKeyMap[oldKey];
        depends.push([key, [value]]);
      }

      const input_type = style2typeMap[style] ?? null;
      if (input_type === null) {
        throw new Error(`Unknown style type: ${style}`);
      }

      const options = list
      .map(
        (o) => {
          const { cover, name, lora, lora_strength, un_office_value } = o;
          const value = trimComma(o.value);
          valueKeyMap[value] = { key: newKey, value: name };

          const settings = {};
          if ((lora ?? '') !== '') {
            Object.assign(settings, { lora: [lora, lora_strength] });
          }
          if ((un_office_value ?? '') !== '') {
            const { base_model } = JSON.parse(un_office_value);
            Object.assign(settings, { base_model });
          }
          if (value !== '') {
            if (settings.lora || settings.base_model
                || newKey === 'race' || newKey === 'type') {
              Object.assign(settings, { base_prompt: value });
            } else {
              Object.assign(settings, { prompt: value });
            }
          }

          const result = { value: name, settings };
          if (['image_select_big', 'image_select'].includes(input_type)) {
            return Object.assign(result, { url: cover });
          }
          if (input_type === 'discrete_sliders') {
            return result;
          }
          if (input_type === 'color_select') {
            const [colorValue, color] = name.split(' ').map(s => s.trim());
            return Object.assign(result, { value: colorValue, color });
          }
          if (input_type === 'long_text_input') {
            Object.assign(settings, { prompt: undefined });
            return Object.assign(result, { title: name, value });
          }
          if (input_type === 'text_select') {
            return Object.assign(result, { group: null });
          }
          if (input_type === 'voice_select') {
            Object.assign(settings, { prompt: undefined });
            return Object.assign(result, { url: cover, title: name, value });
          }

          if (input_type === 'dialogue_list') {
            throw new Error('Not implemented dialogue_list migration');
          }
          if (input_type === 'text_input') {
            throw new Error('Not implemented text_input migration');
          }
          throw new Error(`Unhandled input_type: ${input_type}`);
        }
      )
      .map(o => {
        if (o.value === o.settings.prompt) {
          Object.assign(o.settings, { prompt: undefined });
        }
        return o;
      });

      const step = {
        key: newKey,
        title: newTitle,
        required: must_choose === 1,
        max_select: Math.max(multiple, 1),
        depends,
        input_type,
        options,
      };

      if (newKey === 'tags') {
        if (tags_step !== null) {
          const oldDepends = _.groupBy(tags_step.depends, d => d[0]);
          for (const [key, values] of step.depends) {
            if (!oldDepends[key]) {
              tags_step.depends.push([key, values]);
              continue;
            }

            const oldValues = oldDepends[key][0][1];
            const newValues = values.filter(v => !oldValues.includes(v));
            oldValues.push(...newValues);
          }

          return acc;
        }
        step.options = tags;
        tags_step = step;
      }

      acc.push(step);
      return acc;
    },
    []
  );

  return options;
}

function convertTags(old) {
  const { character_tag_list: { list } } = old;
  return list.flatMap(({ name, tagList }) => tagList.map(tag => ({
    value: tag.name,
    group: name,
  })));
}