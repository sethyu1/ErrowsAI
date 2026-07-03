// Tag相关类型定义
export type Tags = [string, string[]][];

export interface OptionItem {
    value: string;
    url?: string;
    color?: string;
    title?: string;
    group?: string | null;
}

export interface InputField {
    key: string;
    title: string;
    required: boolean;
    max_select: number;
    depends: Array<[string, string[]]>;
    input_type: string;
    options: OptionItem[];
}

export interface GroupedItem {
    label: string;
    value: string;
}

export interface GroupedData {
    key: string;
    title: string;
    items: GroupedItem[];
}

export interface RoleSelectorProps {
    defaultRoleId?: string;
    noTrigger?: boolean;
    onConfirm?: (userId: string) => void;
}

export interface RoleSelectorRef {
    open: () => void;
    close: () => void;
}

