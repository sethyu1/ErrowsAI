import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { claimTaskApi } from '@/apis';
import { TASK_LIST_KEY, MEMBER_INFO_KEY } from '@/config/query-keys';

/** 领取任务 */
export function useClaimTask() {
  const {
    isPending: loading,
    mutateAsync: claimTask,
  } = useMutation({
    mutationFn: claimTaskApi,
    onMutate: async (taskId) => {
      // 撤销相关的查询（乐观更新前必须执行）
      await queryClient.cancelQueries({ queryKey: TASK_LIST_KEY });

      // 保存之前的状态快照
      const previousTasks = queryClient.getQueryData<API.Task.TaskInfo[]>(TASK_LIST_KEY);

      // 乐观更新缓存
      if (previousTasks) {
        queryClient.setQueryData<API.Task.TaskInfo[]>(
          TASK_LIST_KEY,
          previousTasks.map((task) =>
            task.id === taskId ? { ...task, is_claimed: true } : task
          )
        );
      }

      // 返回快照以供回滚
      return { previousTasks };
    },
    onSettled: () => {
      // 无论成功还是失败，都重新获取最新数据以确保同步
      queryClient.invalidateQueries({ queryKey: TASK_LIST_KEY });
      // 刷新用户信息以更新金币数量
      queryClient.invalidateQueries({ queryKey: MEMBER_INFO_KEY });
    }
  });

  return {
    loading,
    claimTask
  };
}
