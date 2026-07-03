import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { fetchTasksApi } from '@/apis';
import { TASK_LIST_KEY } from '@/config/query-keys';
import { useGlobalStore } from '@/stores/global';

/** 获取任务列表 */
export function useTask() {
  const { t } = useTranslation();

  const { locale } = useGlobalStore(useShallow(state => ({
    locale: state.locale,
  })));

  function getTaskLocales(type: API.Task.TaskType, options: { progress: number; number: number }) {
    const { progress, number } = options;

    const taskMap: Record<API.Task.TaskType, { title: string; desc: string }> = {
      'daily_login': {
        title: t('task.dailyLogin.title'),
        desc: t('task.dailyLogin.desc', { number }),
      },
      'character_follow': {
        title: t('task.characterFollow.title', { progress }),
        desc: t('task.characterFollow.desc', { progress, number }),
      },
      'character_chat': {
        title: t('task.characterChat.title'),
        desc: t('task.characterChat.desc', { progress, number }),
      },
      'character_image_gen': {
        title: t('task.characterImage.title', { progress }),
        desc: t('task.characterImage.desc', { progress, number }),
      },
      'post_comment': {
        title: t('task.postComment.title'),
        desc: t('task.postComment.desc', { number }),
      }
    };

    return taskMap[type];
  }

  const {
    data: list = [],
    isPending: tasksLoading,
    refetch: tasksRefetch,
  } = useQuery({
    queryKey: [...TASK_LIST_KEY],
    queryFn: fetchTasksApi,
    staleTime: 0,
    refetchOnMount: true,
  });

  const tasks = React.useMemo(
    () => {
      return list.map((item) => {
        const type = item.name;

        const locales = getTaskLocales(type, {
          progress: item.goal,
          number: item.token,
        });

        return {
          ...item,
          title: locales.title,
          description: locales.desc,
        }
      })

    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, list]
  );

  return {
    tasksLoading,
    tasks,
    tasksRefetch,
  };
}
