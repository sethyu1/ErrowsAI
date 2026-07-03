import { request } from '@/apis/request';

/**
 * 获取语言配置列表
 * GET /ops/languages
 * @returns 语言配置列表
 */
export function getLanguageConfigApi() {
  // TODO: 暂时使用 Promise.resolve 返回模拟数据
  return Promise.resolve<API.Language.LanguageConfig[]>([
    {
      code: 'en',
      name: 'English',
      enabled: true,
      order: 0,
      isDefault: true,
    },
    {
      code: 'zh-CN',
      name: '简体中文',
      enabled: false,
      order: 1,
      isDefault: false,
    },
    {
      code: 'it',
      name: 'Italiano',
      enabled: true,
      order: 2,
      isDefault: false,
    },
    {
      code: 'ja',
      name: '日本語',
      enabled: true,
      order: 3,
      isDefault: false,
    },
  ]);
  
  // 实际API调用（待后端接口实现后启用）
  // return request.get<API.Language.LanguageConfig[]>('/ops/languages');
}

/**
 * 更新语言配置
 * PUT /ops/languages
 * @param data 语言配置数据
 * @returns void
 */
export function updateLanguageConfigApi(data: API.Language.UpdateLanguageConfigRequest) {
  // TODO: 暂时使用 Promise.resolve 模拟保存成功
  console.log('保存语言配置：', data);
  return Promise.resolve<void>(undefined);
  
  // 实际API调用（待后端接口实现后启用）
  // return request.put<void>('/ops/languages', data);
}

