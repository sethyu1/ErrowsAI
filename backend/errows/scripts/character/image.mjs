import fs from 'node:fs/promises';
import path from 'node:path';


export const command = 'image [file_path]';
export const describe = 'migrate image generation config from old character settings';
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
  const oldSettings = (JSON.parse(content)).data.generate_img_config;
  const newSettings = characterImageConfig(oldSettings);
  console.log(JSON.stringify(newSettings));
}

function characterImageConfig(oldSettings) {
  return oldSettings.map(item => {
    const {
      key, name,
      generate_type, multiple, must_chose,
      list,
    } = item;
    const newKey = key === 'bacground' ? 'background' : key;

    const gender = generate_type.toLowerCase();

    const options = list.map(opt => {
      const { cover, name, value }= opt;

      const prompts = value.map(v => {
        return trimBrackets(trimComma(v))
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .join(',');
      })
      .filter(s => s.length > 0);

      return { value: name, url: cover, prompts };
    });


    return {
      key: newKey,
      title: name,
      gender,
      min_select: must_chose ? 1 : 0,
      max_select: multiple ? multiple : 1,
      options
    };
  });
}

function trimComma(str) {
  return str.replace(/^,+|,+$/g, '').trim();
}
function trimBrackets(str) {
  return str.replace(/^\(+|\)+$/g, '').trim();
}