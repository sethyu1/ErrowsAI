declare namespace API {
  namespace Task {
    /**
     * 任务类型
     *   daily_login: 每日登录
     *   character_follow: 关注角色
     *   character_chat: 与角色聊天
     *   character_image_gen: 生成角色图
     *   post_comment: 发布评论
     */
    type TaskType =
      'daily_login' |
      'character_follow' |
      'character_chat' |
      'character_image_gen' |
      'post_comment';

    interface TaskInfo {
      /** 唯一标识 */
      id: string;
      /** 类型 */
      name: TaskType;
      /** 标题 */
      title: string;
      /** 描述 */
      description: string;
      /** 当前进度 */
      progress: number;
      /** 是否可领取 */
      is_completed: boolean;
      /** 是否已领取 */
      is_claimed:  boolean;
      /** 目标值 */
      goal: number;
      /** 奖励数量 */
      token: number;
      prize: number;
      /** 奖励类型 */
      type: 'token' | 'gift';
    }
  }
}
