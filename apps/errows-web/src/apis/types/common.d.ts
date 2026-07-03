declare namespace API {
  namespace Common {
    /** 分页常用参数 */
    interface PaginationParams {
      /** 页码，默认 0 */
      page: number;
      /** 每页数量，默认 10 */
      size: number;
    }

    interface PaginationResult<D> {
      list: D[];
      /** 数量 */
      total: number;
    }

    /** 性别 */
    type Gender = 'Male' | 'Female' | 'unknown';

    /**
     * 订阅计划类型
     * yearly: 年; monthly: 月;
     */
    type PalnType = 'yearly' | 'monthly';

    /**
     * 订阅计划级别
     */
    type PalnLevel = 'galaxy' | 'luna' | 'star';
  }
}
