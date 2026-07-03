import { alertDialog } from "@errows/design";
import i18n from "i18next";

export const confirmExitGenerating = (onConfirm: () => Promise<void>) => {
    const t = i18n.t;
    alertDialog.confirm({
        title: t('generate.exitGenerating'),
        content: t('generate.exitGeneratingContent'),
        confirmText: t('generate.exit'),
        cancelText: t('common.cancel'),
        onConfirm: async () => {
            try {
                await onConfirm();
            } catch {
                // 保持静默失败，不改变当前 UI 状态
            }
        }
    });
}


// 随机选择函数
export const getRandomItem = (arr: string[]) => {
    if (arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
};


const SortActions  = ["Action","Action*","Outfit", "Face", "Status", "Background",] as const;

export const getSortAction = (action: string): number=> {
    return SortActions.findIndex((item) => item === action) ?? 100;
}

const SPEED_UP_STORAGE_KEY = 'errows_sped_up_tasks';

export function getSpedUpTasks(): string[] {
    try {
        return JSON.parse(localStorage.getItem(SPEED_UP_STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

export function markTaskSpedUp(taskId: string): void {
    const tasks = getSpedUpTasks();
    if (!tasks.includes(taskId)) {
        tasks.push(taskId);
        if (tasks.length > 200) tasks.splice(0, tasks.length - 200);
        localStorage.setItem(SPEED_UP_STORAGE_KEY, JSON.stringify(tasks));
    }
}

export function isTaskSpedUp(taskId: string): boolean {
    return getSpedUpTasks().includes(taskId);
}