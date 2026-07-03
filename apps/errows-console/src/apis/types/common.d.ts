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
      data: D[];
      /** 数量 */
      count: number;
    }
  }
}
