// 步骤字段配置
export const stepGroups: Array<{ step: number; fields: string[] }> = [
  {
    step: 1,
    fields: ['gender', 'type'],
  },
  {
    step: 2,
    fields: ['assortment', 'race', 'age'],
  },
  {
    step: 3,
    fields: ['eye_color', 'hair_style', 'hair_length', 'hair_bangs', 'hair_color', 'body_type', 'breast_size', 'butt_size', 'penis_size'],
  },
  {
    step: 4,
    fields: ['voice', 'nickname', 'introduction', 'settings', 'greeting', 'personality', 'tags', 'scenario', 'conversation'],
  },
  {
    step: 5,
    fields: [], // 预览步骤，不需要字段
  },
];

export const INPUT_PLACEHOLDER = {
  nickname: '角色昵称',
  introduction: '角色介绍',
  settings: '角色设定',
  greeting: '角色问候语',
  personality: '角色性格',
  tags: '角色标签',
  scenario: '角色场景',
};