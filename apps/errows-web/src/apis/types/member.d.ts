declare namespace API {
  namespace Member {
    interface Stats {
      /** 删除的角色数量 */
      characters_deleted: number;
      /** 关注的角色数量 */
      characters_followed: number;
      /** 点赞的角色数量 */
      characters_liked: number;
      /** 私有角色数量 */
      characters_private: number;
      /** 公开角色数量 */
      characters_public: number;
      /** 图片数量 */
      media_images: number;
      /** 视频数量 */
      media_videos: number;
      /** 帖子数量 */
      posts: number;
      /** 会话消息数量 */
      session_messages: number;
    }

    // ======================== 当前会员信息 ========================
    interface InfoResult {
      /** 免费金币余额 */
      coin_free_balance: number;
      /** 已购买金币余额 */
      coin_purchased_balance: number;
      /** 会员等级 */
      plan: 'galaxy' | 'luna' | 'star' | 'free' | 'cd-key';
      /** 会员类型 */
      plan_type: 'yearly' | 'monthly' | null;
      /** Stripe 订阅 ID */
      subscription_id: string | null;
      /** 会员过期时间 */
      valid_until: string;
    }
  }
}
