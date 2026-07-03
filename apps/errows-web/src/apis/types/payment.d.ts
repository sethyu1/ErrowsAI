/// <reference path="./common.d.ts" />

declare namespace API {
  namespace Payment {
    /**
     * 支付状态
     * pending: 支付中; succeeded: 成功; failed: 失败;
     */
    type Status = 'pending' | 'succeeded' | 'failed';

    /**
     * 订阅计划类型
     * yearly: 年计划; monthly: 月计划;
     */
    type PalnType = 'yearly' | 'monthly';

    interface CoinProductInfo {
      /** 唯一标识 */
      id: string;
      /** 产品名称 */
      title: string;
      /** 支付平台名称 */
      name: string;
      /** 金币数量 */
      amount: number;
      /** 折扣 */
      discount_rate: number;
      /** 价格 */
      price: number;
      /** 原价 */
      before_discount_price: number;
    }

    /** 订阅计划信息 */
    interface PalnInfo {
      /** 唯一标识 */
      id: string;
      /** 名称 */
      name: Common.PalnLevel;
      /** 类型 */
      type: PalnType;
      /** 原价 */
      before_discount_price: number;
      /** 价格 */
      price: number;
      /** 折扣率 */
      discount_rate: number;
      /** 每月赠送代币 */
      bonus_coin: number;
      /** 每月发放日期 */
      bonus_date: number;
      /** 每月发放时间 */
      bonus_time: number;
      /** 订阅权益描述 */
      rights: string;
      /** 订阅价值描述 */
      value: string;
    }

    // ======================== CD-key 兑换 ========================
    interface RedeemData {
      key: string;
    }
    /** 兑换成功响应 */
    interface RedeemResult {
      message?: string;
    }

    // ======================== 金币相关 ========================
    interface PaymentCoinResult {
      /** 唯一标识 */
      id: string;
      /** 付款链接 */
      checkout_url: string;
      session_id: string;
    }

    // ======================== 订阅相关 ========================
    interface PaymentPlanResult {
      /** 唯一标识 */
      id: string;
      /** 付款链接 */
      checkout_url: string;
      session_id: string;
    }

    // ======================== 支付状态 ========================
    interface PaymentStatusResult {
      id: string;
      status: Status;
    }
  }
}
