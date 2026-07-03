declare namespace API {
  namespace Payment {
    interface SUBSCRIPTION_PRODUCT {
      id: string; // 订阅计划 ID
      name: 'star' | 'luna' | 'galaxy'; // 订阅产品名称
      type: 'monthly' | 'yearly'; // 订阅类型

      price_id: string; // 价格 ID, 用于标识价格
      price: number; // 订阅价格，单位：美元
      discount_rate: number; // 折扣率（0-100）
      before_discount_price: number; // 折扣前价格，单位：美元

      bonus_coin: number; // 每月赠送货币数量（0-999999）
      bonus_date: number; // 每月赠送货币的日期（1-31中的整数）
      bonus_time: number; // 每月赠送货币的时间（0-24中的整数，小时）

      value: string; // 订阅价值描述
      rights: string; // 订阅权益描述
    }

    type CDKeyUsageType = 'one_time' | 'multiple';

    interface CDKeyRow {
      id: string;
      key: string;
      display_key: string;
      usage_type: CDKeyUsageType;
      max_redemptions: number | null;
      redemption_count?: number;
      plan: string;
      coin_amount: number;
      created_by: string;
      redeemed_by: string | null;
      redeemed_at: string | null;
      created_at: string;
      valid_from: string;
      valid_to: string;
      benefit_plan: string | null;
      benefit_plan_start_days: number | null;
      benefit_plan_end_days: number | null;
      benefit_plan_valid_from: string | null;
      benefit_plan_valid_to: string | null;
      benefit_coin_gold: number;
      benefit_coin_free: number;
    }

    interface CDKeyUpdateParams {
      display_key?: string;
      valid_from?: string;
      valid_to?: string;
      benefit_plan?: 'free' | 'star' | 'luna' | 'galaxy';
      benefit_plan_start_days?: number;
      benefit_plan_end_days?: number;
      benefit_plan_valid_from?: string;
      benefit_plan_valid_to?: string;
      benefit_coin_gold?: number;
      benefit_coin_free?: number;
      max_redemptions?: number;
    }

    interface CDKeyListParams {
      page?: number;
      pageSize?: number;
      plan?: string;
      redeemed?: boolean;
      usage_type?: CDKeyUsageType;
    }

    interface CDKeyListResult {
      list: API.Payment.CDKeyRow[];
      total: number;
    }

    interface CDKeyCreateParams {
      display_key?: string;
      usage_type?: CDKeyUsageType;
      max_redemptions?: number;
      plan?: 'free' | 'star' | 'luna' | 'galaxy';
      coin_amount?: number;
      count?: number;
      valid_from?: string;
      valid_to?: string;
      benefit_plan?: 'free' | 'star' | 'luna' | 'galaxy';
      benefit_plan_start_days?: number;
      benefit_plan_end_days?: number;
      benefit_plan_valid_from?: string;
      benefit_plan_valid_to?: string;
      benefit_coin_gold?: number;
      benefit_coin_free?: number;
    }

    type CDKeyCreateResult = API.Payment.CDKeyRow | API.Payment.CDKeyRow[];
  }
}

