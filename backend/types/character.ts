export type CHARACTER_CREATE_OPTION = {
  key: string; // 配置项键名
  title: string; // 配置项标题
  required: boolean; // 是否必填
  max_select: number; // 最大可选数量
  // 依赖关系, 用户已选项满足所有依赖项才会展示此配置项
  depends: [key: string, value: string[]][];
} & (
  | {
      input_type: 'image_select' | 'image_select_big'
      options: {
        url: string; // 封面图 URL
        value: string; // 选项标题 / 选项值
      }[];
  }
  | {
      input_type: 'discrete_slider'
      options: {
        value: string; // 选项标题 / 选项值
      }[];
  }
  | {
      input_type: 'color_select'
      options: [
        {
          color: string; // 颜色值 hex value
          value: string; // 选项标题 / 选项值
        }
      ];
  }
  | {
      input_type: 'voice_select'
      options: {
        url: string;     // 封面图 URL
        value: string;  // 选项值
        title: string;  // 选项标题
      }[];
  }
  | {
      input_type: 'text_select'
      options: {
        group: string; // 选项分组
        value: string; // 选项标题 / 选项值
      }[];
  }
  | {
      input_type: 'long_text_input', options: {
      title: string; // 选项标题
      value: string; // 选项值
    }[]
  }
  | { input_type: 'text_input', options: [] }
  | { input_type: 'dialogue_list', options: [] }
)


export interface CHARACTER_IDENTITY {
  nickname: string // 昵称
  description: string // 描述
  gender: 'male' | 'female'; // 性别
  type: 'anime' | 'realistic'; // 角色类型
  assortment: string // 种类
  race: string // 种族
  color: string // 颜色
  age: string // 年龄
}

export interface CHARACTER_STYLE extends Record<string, string | string[]> {
  eye_color: string // 眼睛颜色
  hair_style: string // 发型
  hair_length: string // 发长度
  hair_bangs: string // 刘海
  hair_color: string // 发色
  body_type: string // 体型
  breast_size: string // 胸部大小
  butt_size: string // 臀部大小
  tags: string[] // 标签
  s_tags: string[]
}

export interface CHARACTER_DIALOGUE {
  voice: string // 声音 id
  settings: string // 角色设定
  greeting: string // 角色问候语
  personality: string // 角色个性
  scenario: string // 角色场景,
  conversation: {
    user: string // 用户示例对话
    character: string // 角色示例对话
  }[] // 角色示例对话
}

interface CHARACTER_API_PARAM_BASE {
  prompt: string[];
  base_prompt: string[];
  base_model: string[];
  lora: [name: string, strength: number][];
}
export interface CHARACTER_MODEL_PARAM extends
  Partial<CHARACTER_API_PARAM_BASE> {
  key: string;
  value: CHARACTER_SETTING[string];
}

export interface CHARACTER_MODEL_PARAMS {
  params: CHARACTER_MODEL_PARAM[];
  params_override?: Partial<CHARACTER_API_PARAM_BASE> & Partial<{
    body: string[];
  }>;
}

export type CHARACTER_SETTING = CHARACTER_IDENTITY
& CHARACTER_STYLE
& CHARACTER_DIALOGUE;

interface CHARACTER_OWNER {
  id: string; // 用户 ID
  name: string; // 用户名
  avatar_url: string; // 用户头像 URL
}

export interface CHARACTER extends CHARACTER_IDENTITY {
  id: string; // 角色 ID
  owner: CHARACTER_OWNER; // 角色拥有者
  avatar_url: string; // 角色头像 URL
  greeting_image?: string | null; // 问候图路径
  background_image_files?: string | null; // 背景图路径(逗号分隔)
  ncover?: number | null;
  status:
    | 'pending' // 待生成
    | 'generating' // 生成中
    | 'private' // 私密
    | 'public' // 公开
    | 'deleted' // 已删除
  ;
  liked: boolean; // 当前用户是否已点赞
  followed: boolean; // 当前用户是否已关注
  social: {
    comments_count: number; // 评论数
    likes_count: number; // 点赞数
    followed_count: number; // 关注数
    posted_count: number; // 发布数
    dialogues_count: number; // 对话数
    video_count: number; // 视频数
    intimacy_score: number; // 亲密度分数
  }
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

export interface CHARACTER_LIST_PARAMS_BASE {
  page: number; // 页码，默认 0
  size: number; // 每页数量，默认 10
  sort: | 'popular' | 'newest' | 'most_liked' | 'alphabetical' | 'latest' | 'created_at';
  q: string // 搜索关键词
}

export type CHARACTER_LIST_PARAMS = Partial<CHARACTER_LIST_PARAMS_BASE & {
   // 同一类 tag 可以有多值，或关系，不同类 tag 之间是与关系
  tags: [type: string, values: string[]][];
  recommended: boolean; // 是否只返回推荐的角色
}>

export interface CHARACTER_SUMMARY {
  id: string; // 角色 ID
  nickname: string; // 角色昵称
  avatar_url: string; // 角色头像 URL
  gender: string; // 角色性别
}
