declare namespace API {
  namespace Coin {
    interface Product {
      /** 唯一标识 */
      id: string;
      /** 产品名称 */
      title: string;
      /** 支付平台标识 */
      price_id: string;
      /** 金币数量 */
      amount: number;
      /** 折扣 */
      discount_rate: number;
      /** 价格 */
      price: number;
      /** 原价 */
      before_discount_price: number;
    }

    interface UpdateCoinProductsData {
      products: Product[]
    }
  }
}

