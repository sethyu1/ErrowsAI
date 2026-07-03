import type { QueryKey } from '@tanstack/react-query';

// ======================== 用户 ========================

/** 当前用户信息 */
export const USER_CURRENT_KEY: QueryKey = ['user', 'current'];

// ======================== 任务 ========================
export const TASK_LIST_KEY: QueryKey = ['task', 'list'];

// ======================== 金币产品 ========================
export const COIN_PRODUCTS_KEY: QueryKey = ['coin', 'products'];

// ======================== 订阅计划 ========================

export const PLAN_LIST_KEY: QueryKey = ['plan', 'list'];

// ======================== 会员 ========================

/** 当前会员信息 */
export const MEMBER_INFO_KEY: QueryKey = ['member', 'info'];

// ======================== 角色 ========================

/** 当前会员角色 */
export const CHARACTER_MY_IMAGES_KEY: QueryKey = ['character', 'my', 'images'];

/** 当前会员角色 */
export const CHARACTER_MY_IMAGES_LIST_KEY: QueryKey = ['character', 'my', 'images', 'list'];
