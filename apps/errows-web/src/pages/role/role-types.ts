export interface RoleDictOptions {
    value: string
    prompt?: string
    url?: string
    color?: string
}

// 表单类型  分别是 大图片选择  年龄选择   图片选择  文本textArea   标签选择   文本输入  颜色选择  对话列表
export type RolFormType = 'image_select_large' | 'discrete_sliders' | 'image_select' | 'long_text_input' | 'text_select' | 'text_input' | 'color_select' | 'dialogue_list'

/** 依赖项，可能依赖多个form字段 [string(依赖字段), [string(匹配值)]]  */
export type RoleDepends = Array<
    [string, [string]]>

export interface RoleDict {
    depends: RoleDepends;
    key: string;
    max_select: number;
    options: RoleDictOptions[];
    required: boolean;
    title: string;
    input_type: RolFormType;
}

export interface RoleGroup {
    [key: string]: RoleDict[]
}