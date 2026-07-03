// 模型错误基类
export class ModelError<TYPES extends string> extends Error {
  type: TYPES
  data: unknown

  constructor(
    type: TYPES,
    message: string = type,
    data?: unknown
  ) {
    super(message);
    this.type = type;
    this.data = data;
  }
}