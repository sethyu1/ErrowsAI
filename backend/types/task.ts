import { SESSION_GIFT } from "./session";

export type DAILY_TASK = {
  id: string;
  name:
    | 'daily_login'      // 每日登录
    | 'character_follow' // 关注角色
    | 'character_chat' // 与角色聊天
    | 'character_image_gen' // 生成角色图片
    | 'post_comment';   // 发布评论
  title: string; // 任务标题
  description: string; // 任务描述
  progress: number; // 完成数量
  goal: number; // 目标数量
  is_completed: boolean; // 是否已完成
  is_claimed:  boolean; // 是否已领取奖励
} & (
| { type: 'token', token: number } // 代币奖励
| { type: 'gift'; gift: SESSION_GIFT } // 礼物奖励
)