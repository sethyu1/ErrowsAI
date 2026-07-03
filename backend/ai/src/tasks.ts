
interface TaskRunner<Task, Result> {
  (task: Task, task_id: string): Promise<Result>;
}

interface TaskItem<TaskArgs, Result> {
  task: TaskArgs;
  promise: Promise<Result>;
  resolve: (result: Result) => void;
  reject: (error: any) => void;
  status: 'pending' | 'generating';
}

export class TaskQueue<TaskArgs = unknown, Result = void> {
  runner: TaskRunner<TaskArgs, Result>;
  queue: Promise<void>[];
  tasks: Map<string, TaskItem<TaskArgs, Result>>;
  promise: Promise<unknown> = Promise.resolve();
  parallel: number = 1;

  constructor(runner: TaskRunner<TaskArgs, Result>, parallel = 1) {
    this.runner = runner;
    this.tasks = new Map([]);
    this.queue = [];
    this.parallel = parallel;
  }

  append(task_id: string, task: TaskArgs) {
    const existing = this.tasks.get(task_id);
    if (existing !== undefined) {
      return existing.promise;
    }

    let resolveRef: (result: Result) => void = () => {};
    let rejectRef: (error: any) => void = () => {};
    const promise = new Promise<Result>((resolve, reject) => {
      resolveRef = resolve;
      rejectRef = reject;
    });
    this.tasks.set(task_id, {
      task,
      promise,
      resolve: resolveRef,
      reject: rejectRef,
      status: 'pending'
    });
    this.run();
    this.promise = this.promise.then(() => promise.then(() => {}, () => {}));
    return promise;
  }

  status(task_id: string) {
    const item = this.tasks.get(task_id);
    if (item === undefined) {
      return null;
    }
    return item.status;
  }

  remove(task_id: string) {
    this.tasks.delete(task_id);
  }

  async run() {
    if (this.queue.length >= this.parallel) {
      return;
    }

    const next = this.tasks.entries()
      .next().value as [string, TaskItem<TaskArgs, Result>] | undefined;

    if (next === undefined) {
      return;
    }

    const [task_id, taskItem] = next;
    Object.assign(taskItem, { status: 'generating' });
    const { task, resolve, reject } = taskItem;

    const runner = this.runner(task, task_id)
    .then(
      (res) => {
        this.remove(task_id);
        resolve(res);
        return this.run();
      },
      (error) => {
        this.remove(task_id);
        reject(error);
        return this.run();
      }
    );

    this.queue.push(runner);
    await runner
    this.queue = this.queue.filter(r => r !== runner);
  }
}
