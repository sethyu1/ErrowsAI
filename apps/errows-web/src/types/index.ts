import React from 'react';

export type DateType = 'monthly' | 'yearly';

/**
 * 会员类型
 *   galaxy: 银河
 *   luna:  月
 *   star:  星
 */
export type MemberType = 'galaxy' | 'luna' | 'star';

export interface MemberItem {
  /** 会员级别 */
  level: MemberType;
  /** 会员标题 */
  title: string;
  desc: string;
  /** 年度会员收费信息*/
  yearly: {
    /** 是否畅销 */
    best?: boolean;
    /** 折扣 */
    discount: number;
    /** 原价格 */
    originalPrice: number,
    /** 价格 */
    price: number,
  };
  /** 年度会员收费信息 */
  monthly: {
    /** 是否畅销 */
    best?: boolean;
    /** 折扣 */
    discount: number;
    /** 原价格 */
    originalPrice: number,
    /** 价格 */
    price: number,
  };
}


/** 会员信息 */
export interface MemberInfo {
   /** 会员文案 */
  title: string;
  /** 头像 */
  avatar: {
    /** 徽标图片 */
    badge: string;
    /** 背景图片 */
    bg: string;
    /** 装饰图片 */
    decorate: string;
    /** 头像边框渐变 */
    gradient: string[];
    beam?: boolean;
  };
  tag: {
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    color: string;
    background: string;
  };
  card: {
    border: string;
    background: string;
  },
  background: string;
}

