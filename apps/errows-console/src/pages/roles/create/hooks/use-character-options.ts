import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchCharacterOptionsApi } from '@/apis/character';
import { generateFormDependsConfig, groupBy } from '../utils';
import type { RoleDict } from '../types';

/**
 * 获取角色选项配置的 Hook
 */
export function useCharacterOptions() {
  const [characterOptions, setCharacterOptions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<any>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // 如果已经有缓存数据，直接使用
    if (cacheRef.current) {
      setCharacterOptions(cacheRef.current);
      return;
    }

    // 如果已经请求过了，不再重复请求
    if (hasFetchedRef.current) {
      return;
    }

    // 标记为已请求
    hasFetchedRef.current = true;
    setLoading(true);

    fetchCharacterOptionsApi()
      .then((result) => {
        // 保存到 ref 缓存
        cacheRef.current = result;
        setCharacterOptions(result);
      })
      .catch((error) => {
        console.error('Failed to fetch character options:', error);
        // 请求失败时重置标记，允许重试
        hasFetchedRef.current = false;
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
    loading,
  };
}

