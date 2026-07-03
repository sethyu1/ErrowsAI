import { CHARACTER_SUMMARY } from "./character";

export interface CHARACTER_IMAGE_GEN_OPTION {
  value: string; // 选项值 / 选项标题
  url: string; // 选项封面图 URL,
  prompts: string[]; // 选项提示词
}

export interface CHARACTER_IMAGE_GEN_STEP {
  gender: 'male' | 'female'; // 适用性别
  key: string; // 配置项键名
  title: string; // 配置项标题
  min_select: number; // 最少可选数量
  max_select: number; // 最大可选数量
  options: CHARACTER_IMAGE_GEN_OPTION[];
}

export interface CHARACTER_IMAGE_GEN_SETTING {
  outfit: string[]; // 服装
  action: string[]; // 动作
  background: string[]; // 背景
  prompt: string | null; // 用户自定义提示词
}

export interface ASSET_BASE {
  id: string; // 图片 ID
  url: string; // 图片 URL
  created_at: string; // 创建时间
}

export type ASSET_IMAGE = ASSET_BASE;

export type ASSET_VIDEO = ASSET_BASE & {
  cover: string; // 视频封面图 URL
};

export interface ASSET_GEN_TASK_NOT_COMPLETE {
  id: string; // 任务 ID
  status:
    | 'pending'
    | 'generating'
    | 'failed';
};

export type ASSET_IMAGE_GEN_TASK_NOT_COMPLETE
  = ASSET_GEN_TASK_NOT_COMPLETE;

export type ASSET_IMAGE_GEN_TASK =
| ASSET_IMAGE_GEN_TASK_NOT_COMPLETE
| { id: string, status: 'completed'; asset: ASSET_IMAGE };

export interface ASSET_VIDEO_GEN_TASK_NOT_COMPLETE
  extends ASSET_GEN_TASK_NOT_COMPLETE {
    image_id: string; // 生成视频所用的图片 ID
    cover: string; // 视频封面图 URL
}

export type ASSET_VIDEO_GEN_TASK =
| ASSET_GEN_TASK_NOT_COMPLETE
| {
    id: string, status: 'completed';
    image_id: string;
    asset: ASSET_VIDEO;
};

export interface ASSET_IMAGE_SUMMARY {
  character: CHARACTER_SUMMARY; // 角色信息
  count: number; // 该角色图片数量
  cover: string; // 该角色封面图片
}

export interface ASSET_VIDEO_SUMMARY {
  character: CHARACTER_SUMMARY; // 角色信息
  count: number; // 该角色图片数量
  cover: string; // 该角色封面图片
}

export interface LIST_ASSETS_PARAMS {
  q: string; // 搜索关键词
  sort:
  | 'created_at' // 媒体创建时间
  | 'count' // 角色媒体数量
  | 'alphabetical'; // 角色名称字母顺序
  order: 'asc' | 'desc'; // 排序顺序
  status: 'deleted'; // 过滤角色状态
  // 和首页 tags 筛选逻辑一致
  // eg 1: 筛选性别： filters=[['gender', ['Female']]]
  filters: (
    | [feature: 'gender', values: ('Male' | 'Female')[]]
    | [feature: 'tags', values: 'Futa'[]]
  )[];
}
