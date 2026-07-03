// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace API {
  namespace Support {
    /**
     * Support 请求
     */
    interface Support {
      /** ID */
      id: string;
      /** 用户 ID（已登录时） */
      user_id?: string | null;
      /** 支持邮箱 */
      email: string;
      /** 支持类型 */
      type: string;
      /** 支持主题/描述 */
      description: string;
      /** 创建时间 */
      created_at: string;
    }

    /**
     * 获取 Support 列表请求参数
     */
    type FetchSupportsParams = Common.PaginationParams;

    /**
     * 获取 Support 列表响应
     */
    type FetchSupportsResponse = Common.PaginationResult<Support>;
  }
}

