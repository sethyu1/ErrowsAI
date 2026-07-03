// 表单数据类型
export interface CreateDialogFormData {
  mode?: string;
  gender: API.Common.Gender;
  type?: API.Character.Setting['type'];
  creationMode?: 'fast' | 'custom';
  assortment?: string;
  race?: string;
  age?: string;
  voice?: string;
  eye_color?: string;
  hair_style?: string;
  hair_length?: string;
  hair_bangs?: string;
  hair_color?: string;
  body_type?: string;
  breast_size?: string;
  butt_size?: string;
  penis_size?: string;
  tags?: string[];
  nickname?: string;
  description?: string;
  dialogue_settings?: string;
  dialogue_greeting?: string;
  dialogue_personality?: string;
  dialogue_examples?: Array<{ user: string; character: string }>;
}


export interface FieldOption {
  title: string;
  url?: string;
  value: string;
  prompt?: string;
  color?: string;
  group?: string | null;
  label?: string
}

export interface VoiceOption {
  title?: string;
  value?: string;
  label?: string;
  url?: string;
}