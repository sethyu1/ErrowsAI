
export interface COIN_PRODUCT {
  id: string; // 产品 ID
  title: string; // 产品标题, 用于展示
  name?: string; // 产品名称, 用于标识
  amount: number; // 可购买的 coin 数量
  discount_rate: number; // 折扣率
  price_id: string; // 价格 ID, 用于标识价格
  price: number; // 价格, 单位： 美元
  before_discount_price: number; // 折扣前价格, 单位： 美元
}

export interface SUBSCRIPTION_PRODUCT {
  id: string; // 订阅计划 ID
  title: string; // 订阅计划标题, 用于展示
  name: 'star' | 'luna' | 'galaxy'; // 订阅产品名称, 用于标识
  type: 'monthly' | 'yearly'; // 订阅类型

  price_id: string; // 价格 ID, 用于标识价格
  price: number; // 订阅价格，单位：美元
  discount_rate: number; // 折扣率
  before_discount_price: number; // 折扣前价格，单位：美元

  bonus_coin: number; // 每月赠送货币数量
  bonus_date: number; // 每月赠送货币的日期
  bonus_time: number; // 每月赠送货币的时间

  value: string; // 订阅价值描述
  rights: string; // 订阅权益描述
}

export interface BANK_CARD {
  id: string; // 卡片 ID
  exp_month: number; // 有效期月份
  exp_year: number; // 有效期年份
  cvc: number; // cvc
  holder_name: string; // 持卡人姓名
}
