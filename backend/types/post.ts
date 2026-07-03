import { CHARACTER_SUMMARY } from "./character";
import { USER_SUMMARY } from "./user";


export interface POST_COMMENT {
  id: string; // 评论 ID
  reply_to_id: string | null; // 回复评论 ID
  owner: {
    name: string; // 用户名
    avatar_url: string | null; // 用户头像 URL
  },
  content: string; // 评论内容
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

export interface POST_IMAGE {
  id: string; // 图片 ID
  url: string; // 图片 URL
}
export interface POST_SUMMARY {
  id: string; // post ID
  content: string; // post 文本内容（原 subject 已改名为 content）
  images: POST_IMAGE[]; // post 图片列表
  owner: USER_SUMMARY; // 发布用户信息
  character: CHARACTER_SUMMARY; // 角色信息
  comments: POST_COMMENT[]; // 评论列表
  social: {
    likes_count: number; // 点赞数
  }
  feedback: 'like' | 'dislike' | null; // 当前用户反馈
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

export interface POST extends POST_SUMMARY {
  comments: POST_COMMENT[]; // 评论列表
}