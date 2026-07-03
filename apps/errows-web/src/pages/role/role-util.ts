import type { RoleGroup, RoleDict} from './role-types';

/** 生成表单依赖配置 */
export function generateFormDependsConfig(group: RoleGroup): Record<string, string[]> {
   const formDeps = new Map<string, string[]>()
   for (const [key, value] of Object.entries(group)) {
    if(!formDeps.has(key)) {
      formDeps.set(key, []);
      if(value.length > 0) {
        const firstItem = value[0];
        if(firstItem.depends.length > 0) {
          formDeps.set(key, firstItem.depends.map(item => item[0]));
        }
      }
    }
   }
   return Object.fromEntries(formDeps);
}

/** 根据表单字段和依赖值获取表单字段对应的配置项 */
export function getFormDepends(config: {
  group: RoleGroup
  field: string
  dependsValues: Record<string, string | number> // 依赖字段名到值的映射
}): RoleDict | undefined {
  const { group, field, dependsValues } = config;
  const pickedList = group[field];
  if (!pickedList || pickedList.length === 0) return undefined;
  
  // 如果没有依赖，返回第一个配置
  if (!dependsValues || Object.keys(dependsValues).length === 0) {
    return pickedList[0];
  }

  // 找到所有依赖条件都满足的配置项
  const pickedItem = pickedList.find(item => {
    if (!item.depends || item.depends.length === 0) {
      return true;
    }
    // 所有依赖条件都必须满足（AND 逻辑）
    return item.depends.every(([depKey, [depValue]]) => {
      const actualValue = dependsValues[depKey];
      if (actualValue === undefined || actualValue === null) {
        return false;
      }
      // 值匹配（支持字符串和数字的比较）
      return actualValue === depValue;
    });
  });
  
  return pickedItem || pickedList[0];
}

const INPUT_PLACEHOLDER = {
  normal: 'createCharacter.enterFieldPlaceholder',
  withCharacter: 'createCharacter.enterFiledPlaceholderWithCharacter',
  withSubject: 'createCharacter.enterFiledPlaceholderWithSubject',
  introduction: 'createCharacter.enterIntroduction',
}

// 前缀翻译
export const getInputPlaceholderPrefix = (key: string) => {
  switch (key) {
    case 'nickname':
      return INPUT_PLACEHOLDER.withCharacter;
    case 'personality':
      return INPUT_PLACEHOLDER.withCharacter;
    case 'greeting':
      return INPUT_PLACEHOLDER.withCharacter;
    case 'settings':
      return INPUT_PLACEHOLDER.withSubject;
    case 'introduction':
      return INPUT_PLACEHOLDER.introduction;
    default :
    return INPUT_PLACEHOLDER.normal;
  }
}