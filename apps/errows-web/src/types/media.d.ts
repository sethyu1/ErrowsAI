declare namespace Media {
  /** 富媒体卡片数据（用于列表展示） */
  interface MediaCard {
    id: string; // 媒体 ID 或角色 ID
    nickname: string; // 角色昵称
    avatar: string; // 头像/封面 URL
    imageCount: number; // 图片数量
    videoCount: number; // 视频数量
    title: string; // 标题
    roleId?: string; // 角色 ID（用于详情页跳转）
  }

  /** 图片媒体卡片数据（详情页） */
  interface ImageMediaCard {
    id: string; // 图片 ID
    url: string; // 图片 URL
    nickname?: string; // 角色昵称（可选）
    avatar?: string; // 角色头像（可选）
    videoStatus?: 
      | null
      | "pending"
      | "generating"
      | "completed"
      | "failed"; // 视频状态
    createdAt: string; // 创建时间
    updatedAt: string; // 更新时间
  }

  /** 视频媒体卡片数据（详情页） */
  interface VideoMediaCard {
    id: string; // 视频 ID
    url: string; // 视频 URL
    cover: string; // 视频封面 URL
    nickname?: string; // 角色昵称（可选）
    avatar?: string; // 角色头像（可选）
    createdAt: string; // 创建时间
    updatedAt: string; // 更新时间
  }
}

