import { request } from '@/apis/request';

/** 获取任务列表 */
export function fetchTasksApi() {
  return request.get<API.Task.TaskInfo[]>('/tasks');
}

/** 领取任务奖励 */
export function claimTaskApi(id: string) {
  return request.post(`/tasks/${id}/claim`);
}
