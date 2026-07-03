type RaceFn<T> = (...args: any[]) => Promise<T>;
type Task = any[] | null;

const isTheSameTask = (source: Task, tatget: Task) => {
  if (source === null && tatget === null) {
    return true;
  }
  if (source === null || tatget === null) {
    return false;
  }
  return source.every((value, index) => value === tatget[index]);
};


/*
这个高阶函数可以优化流量，保证最后一个任务必定执行
raceResult 是中间被取消的任务返回的数据
*/
export const race = <T>(fn: RaceFn<T>, raceResult: T) => {
  //下一个要执行任务的参数
  let nextTask: Task = null;
  //当前正在执行任务的参数
  let currentTask: Task = null;
  let nextTaskResolve: ((value: T) => void) | null = null;
  let nextTaskReject: ((reason: unknown) => void) | null = null;
  const _run = (
    task: Task,
    resolve: (value: T) => void,
    reject: (reason: unknown) => void
  ) => {
    if (!currentTask) {
      currentTask = task;
      fn.apply(null, Array.isArray(task) ? task : [])
        .then(resolve)
        .catch(reject)
        .finally(() => {
          currentTask = null;
          if (nextTask) {
            _run(nextTask, nextTaskResolve!, nextTaskReject!);
            nextTask = null;
          }
        });
    } else {
      //做一个优化，如果当前正在执行任务的参数和下一个要执行任务的参数相同，则直接返回raceResult
      if (nextTask && nextTaskResolve) {
        nextTaskResolve?.(raceResult);
      }
      if (isTheSameTask(task, currentTask)) {
        resolve(raceResult);
        nextTask = null;
      } else {
        nextTask = task;
        nextTaskResolve = resolve;
        nextTaskReject = reject;
      }
    }
  };
  return (...args: unknown[]) => {
    return new Promise<T>((resolve, reject) => {
      _run(args, resolve, reject);
    });
  };
};
