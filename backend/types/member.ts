
export interface MEMBER_STATS {
  media_images: number; // 生成的图片数量
  media_videos: number; // 生成的视频数量
  characters_public: number; // 公开的角色数量
  characters_private: number; // 私密的角色数量
  characters_deleted: number; // 已删除的角色数量
  characters_followed: number; // 关注的角色数量
  characters_liked: number; // 点赞的角色数量
  session_messages: number; // 创建的会话数量
  posts: number; // 创建的 post 数量
}

export interface MEMBER_INFO {
  id: string; // 会员 ID
  plan: 'free' | 'star' | 'luna' | 'galaxy'; // 会员套餐
  plan_type: 'monthly' | 'yearly' | 'cd-key' | null; // 会员套餐类型
  credential_id: string | null; // 购买凭证 ID
  subscription_id: string | null; // Stripe 订阅 ID
  valid_until: string; // 会员有效期截止时间
  coin_free_balance: number; // 免费代币余额
  coin_purchased_balance: number; // 购买代币余额
}