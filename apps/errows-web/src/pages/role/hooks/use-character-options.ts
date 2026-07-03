import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { persistQueryData, getPersistedQueryData } from '@/lib/query-persist';
import { fetchCharacterOptionsApi } from '@/apis/character';
import { generateFormDependsConfig } from '../role-util';
import { groupBy } from '@/utils'
import type { RoleDict } from '../role-types';

/**
 * 获取角色选项配置的 Hook
 */
export function useCharacterOptions() {
  const characterOptionsQueryKey = ['character-options'];

  // 从持久化存储中读取初始数据（7天缓存）
  const persistedCharacterOptions = useMemo(() => {
    return getPersistedQueryData<Awaited<ReturnType<typeof fetchCharacterOptionsApi>>>(
      characterOptionsQueryKey,
      1000 * 60 * 60 * 24 * 7 // 7天
    );
  }, []);

  // 获取角色配置项（启用持久化缓存）
  const { data: characterOptions } = useQuery({
    queryKey: characterOptionsQueryKey,
    queryFn: async () => {
      const result = await fetchCharacterOptionsApi();
      // 保存到持久化存储
      persistQueryData(characterOptionsQueryKey, result);
      return result;
    },
    placeholderData: persistedCharacterOptions ?? undefined,
    enabled: true,
    staleTime: 1000 * 60 * 60 * 24, // 24小时内数据视为新鲜
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7天内数据保留在缓存中
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // 将选项按 key 分组
  const groupDict = useMemo(() => {
    return groupBy(characterOptions?.options as RoleDict[] ?? [], 'key');
  }, [characterOptions?.options]);

  // 生成表单依赖配置：每个字段依赖的其他字段列表
  const formDependsConfig = useMemo(() => {
    return generateFormDependsConfig(groupDict);
  }, [groupDict]);

  return {
    characterOptions,
    groupDict,
    formDependsConfig,
  };
}

