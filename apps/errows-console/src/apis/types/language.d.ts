declare namespace API {
  namespace Language {
    /**
     * 语言配置项
     */
    interface LanguageConfig {
      /** 语言代码 */
      code: string;
      /** 语言名称 */
      name: string;
      /** 是否启用 */
      enabled: boolean;
      /** 显示顺序 */
      order: number;
      /** 是否为默认语言（不可修改和删除） */
      isDefault?: boolean;
    }

    /**
     * 获取语言配置列表的响应
     */
    interface GetLanguageConfigResponse {
      languages: LanguageConfig[];
    }

    /**
     * 更新语言配置的请求
     */
    interface UpdateLanguageConfigRequest {
      languages: LanguageConfig[];
    }
  }
}

