import type { MemberType } from '@/types';
import { StarSmileIcon, CrownOutlinedIcon, LunaIcon } from '@errows/icons';

/**
 * 会员等级渐变配置
 */
export const gradientConfig: Record<MemberType, string> = {
  star: 'linear-gradient(230.29deg, #F1F6F7 16.69%, #DDE5EC 49.45%, #F1F5FA 84.67%)',
  luna: 'linear-gradient(158.78deg, #F3E495 -90.22%, #8A7966 -58.94%, #BE8921 -7.49%, #FFE25F 39.64%)',
  galaxy: 'linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)',
}

export const shineColorConfig: Record<MemberType, string[]> = {
  star: ['#3d3d3d', '#717171', '#585757'],
  luna: ['#F3E495', '#8A7966', '#BE8921', '#FFD892'],
  galaxy: ['#DD429D', '#B14BF4', '#485CFB'],
}

export const  backgroundColor = {
  default: '#2C203F',
  selected: '#2C203F',
}

/**
 * Tag 颜色
 */
export const tagColorConfig: Record<MemberType, string> = {
  star: '#1B1B1B',
  luna: '#1B1B1B',
  galaxy: '#fff',
}

/**
 * Tag 颜色
 */
export const iconConfig: Record<MemberType, React.FC<React.SVGProps<SVGSVGElement>>> = {
  star: StarSmileIcon,
  luna: LunaIcon,
  galaxy: CrownOutlinedIcon,
}
