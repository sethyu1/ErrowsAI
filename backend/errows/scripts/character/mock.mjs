import path from 'node:path';
import fs from 'node:fs/promises';

export const command = 'migrate <file_path>';
export const describe = 'migrate from old character';
export const builder = {
  file_path: {
    type: 'string',
    describe: 'Path to the old character file'
  }
};

export async function handler(args) {
  const { file_path } = args;
  const fullPath = path.resolve(process.cwd(), file_path);
  const content = await fs.readFile(fullPath, 'utf-8');
  const oldCharacter = (JSON.parse(content)).data.list;
  const newCharacter = oldCharacter.map(covert2New);
  console.log(JSON.stringify(newCharacter[0]));
}

function covert2New(old) {
  const {
    nickname,
    description,
    sex,
    character_gender,
    greeting,
    category,
    un_office_value
  } = old;
  const aiParams = JSON.parse(un_office_value || '{}');
  const base_prompt = aiParams.base_prompt || '';

  //"34 years old, Mexican, brown skin,
  // brown hair, long hair, wavy hair,
  // brown eyes, dark eyeshadow,
  // big breasts,
  // teacher,
  // suit,
  // gentle,
  // modern,"\n' +
  const params = base_prompt.split(',').map(s => s.trim());
  const [
    age = '', assortment = '', color = '',
    hair_color = '', hair_length = '', hair_style = '',
    eye_color = '', eyeshadow = '',
    breast_size = '',
    settings = '', outfit = '',
    personality = '', ...tags
  ] = params;


  return {
    identity: {
      nickname,
      description,
      gender: character_gender || sex || 'female',
      type: category.toLowerCase(),
      assortment,
      color,
      age,
    },
    style: {
      voice: '',
      eye_color,
      hair_style,
      hair_length,
      hair_bangs: '',
      hair_color,
      body_type: '',
      breast_size,
      butt_size: '',
      tags: tags.concat(
        eyeshadow ? [eyeshadow] : [],
        outfit ? [outfit] : []
      ),
    },
    dialogue: {
      settings: settings || base_prompt,
      greeting,
      personality,
      scenario: '',
      examples: [],
    }
  };
}