declare namespace API {
  namespace Gift {
    /**
     * 礼物（统一使用后端字段）
     */
    interface Gift {
      /** 礼物ID */
      id: string;
      /** 礼物名称 */
      name: string;
      /** 图片 URL */
      picture_url: string;
      /** 消耗代币数量 */
      price: number;
      /** 亲密度增加 */
      intimacy: number;
      /** 赠送提示语 */
      prompt: string;
      /** 礼物类型 */
      reply_type: 'text' | 'image';
      /** 是否需要领取 */
      need_claim: boolean;
      /** 有效时间 */
      valid_days: number | null;
      /** 排序 - 前端展示字段 */
      sort?: number;
    }

    /**
     * 获取礼物列表请求参数
     */
    interface FetchGiftsParams {
      /** 页码（从 0 开始） */
      page: number;
      /** 每页数量 */
      size: number;
    }

    /**
     * 获取礼物列表响应
     */
    interface FetchGiftsResponse {
      /** 总数 */
      count: number;
      /** 礼物列表 */
      data: Gift[];
    }

    /**
     * 添加礼物响应
     */
    interface AddGiftResponse {
      /** 礼物ID */
      id: string;
    }
  }
}

