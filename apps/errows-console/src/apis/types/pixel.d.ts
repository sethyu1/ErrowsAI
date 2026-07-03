/* eslint-disable @typescript-eslint/no-empty-object-type */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./common.d.ts" />

declare namespace API {
  namespace Pixel {
    interface Info {
      /** 唯一标识 */
      pixel_id: string;
      /** token */
      access_token: string;
      /** 备注 */
      remark: string;
    }

    // ======================== 列表 ========================
    interface FetchPixelListParams extends Common.PaginationParams {};

    interface FetchPixelListResult extends Common.PaginationResult<Info> {};

    // ======================== 创建 ========================
    interface CreatePixeData extends Info {};
  }
}
