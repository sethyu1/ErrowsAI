import { StarSmileIcon, VipCrownIcon, LunaIcon } from '@errows/icons';
import type { MemberType, MemberInfo, MemberItem } from '@/types';
import i18n from '@/lib/i18n';
import galaxy from '@/assets/images/member/galaxy.webp';
import galaxyBadge from '@/assets/images/member/galaxy-badge.webp';
import galaxyDecorate from '@/assets/images/member/galaxy-decorate.webp';
import luna from '@/assets/images/member/luna.webp';
import lunaBadge from '@/assets/images/member/luna-badge.webp';
import lunaDecorate from '@/assets/images/member/luna-decorate.webp';
import star from '@/assets/images/member/star.webp';
import starBadge from '@/assets/images/member/star-badge.webp';
import starDecorate from '@/assets/images/member/star-decorate.webp';

/** 会员配置 */
export const MEMBER_CONFIG: Record<MemberType, MemberInfo> = {
  galaxy: {
    title: 'Galaxy',
    avatar: {
      badge: galaxyBadge,
      bg: galaxy,
      decorate: galaxyDecorate,
      gradient: [
        'linear-gradient(163.44deg, #FFFEFF 6.05%, #DBC9D7 23.87%, #F9D9FF 40.45%, #CFABCF 63.67%, #FFFFFF 88.54%)',
        'linear-gradient(138.18deg, #CAA030 9.52%, #B7902E 37.86%, #8A5D19 58.15%, #FFF1A0 77.3%)'
      ],
      beam: true,
    },
    tag: {
      icon: VipCrownIcon,
      color: '',
      background: 'linear-gradient(129.77deg, #FFFEFF -87.62%, #DBC9D7 -37.02%, #F9D9FF 10.04%, #CFABCF 75.93%, #FFFFFF 146.53%)'
    },
    card: {
      border: 'linear-gradient(96.61deg, #DD429D 0%, #B14BF4 50%, #485CFB 100%)',
      background: 'linear-gradient(180deg, rgba(43, 27, 72, 0.8) 0%, rgba(29, 1, 47, 0.8) 100%)',
    },
    background: 'linear-gradient(180deg, rgba(43, 27, 72, 0.8) 0%, rgba(29, 1, 47, 0.8) 100%)',
  },
  luna: {
    title: 'Luna',
    avatar: {
      badge: lunaBadge,
      bg: luna,
      decorate: lunaDecorate,
      gradient: [
        'linear-gradient(163.44deg, #F3E495 2.31%, #8A7966 33.41%, #BE8921 64.91%, #FFD892 88.54%)'
      ],
    },
    tag: {
      icon: LunaIcon,
      color: 'rgba(0,0,0,0.7)',
      background: 'linear-gradient(158.78deg, #F3E495 -90.22%, #8A7966 -64.33%, #BE8921 -7.49%, #FFE25F 106.94%)',
    },
    card: {
      border: 'linear-gradient(163.44deg, #F3E495 2.31%, #8A7966 33.41%, #BE8921 64.91%, #FFD892 88.54%)',
      background: 'linear-gradient(180deg, rgba(43, 27, 72, 0.8) 0%, rgba(29, 1, 47, 0.8) 100%)',
    },
    background: 'linear-gradient(180deg, rgba(55, 51, 36, 0.8) 0%, rgba(33, 26, 0, 0.8) 84.76%)',
  },
  star: {
    title: 'Star',
    avatar: {
      badge: starBadge,
      bg: star,
      decorate: starDecorate,
      gradient: [
        'linear-gradient(163.44deg, #FFFFFF 2.31%, #8893A6 33.41%, #797979 64.91%, #E9E9E9 88.54%)'
      ],
    },
    tag: {
      icon: StarSmileIcon,
      color: 'rgba(0,0,0,0.7)',
      background: 'linear-gradient(215.79deg, #D9D9D9 25.96%, #D6B8D4 91.04%)'
    },
    card: {
      border: 'linear-gradient(163.44deg, rgba(255, 254, 255, 0.4) 6.05%, rgba(219, 201, 215, 0.4) 23.87%, rgba(249, 217, 255, 0.4) 40.45%, rgba(207, 171, 207, 0.4) 63.67%, rgba(255, 255, 255, 0.4) 88.54%)',
      background: 'linear-gradient(180deg, rgba(43, 27, 72, 0.8) 0%, rgba(29, 1, 47, 0.8) 100%)',
    },
    background: 'linear-gradient(180deg, rgba(40, 40, 40, 0.8) 2.38%, rgba(13, 13, 13, 0.8) 98.08%)',
  },
}

export const MEMBER_LIST: MemberItem[] = [
  {
    level: 'star',
    title: 'Star',
    desc: 'basic access',
    yearly: {
      best: false,
      originalPrice: 239.88,
      discount: 0,
      price: 153.5
    },
    monthly: {
      best: false,
      originalPrice: 19.99,
      discount: 0,
      price: 15.99,
    },
  },
  {
    level: 'luna',
    title: 'Luna',
    desc: 'per month',
    yearly: {
      best: false,
      originalPrice: 431.88,
      discount: 0,
      price: 224.91,
    },
    monthly: {
      best: false,
      originalPrice: 35.99,
      discount: 0,
      price: 24.99,
    },
  },
  {
    level: 'galaxy',
    title: 'Galaxy',
    desc: 'per month',
    yearly: {
      best: false,
      originalPrice: 719.88,
      discount: 0,
      price: 335.91,
    },
    monthly: {
      best: false,
      originalPrice: 59.99,
      discount: 0,
      price: 39.99,
    },
  }
];

export function getMemberFeatures(member: MemberType) {
  const featuresMap: Record<MemberType, string[]> = {
    star: [
      i18n.t('auth.planDesc1', { total: 400 }),
      i18n.t('auth.planDesc2'),
      i18n.t('auth.planDesc3'),
      i18n.t('auth.planDesc4'),
      i18n.t('auth.planDesc5'),
    ],
    luna: [
      i18n.t('auth.planDesc1', { total: 1200 }),
      i18n.t('auth.planDesc2'),
      i18n.t('auth.planDesc6', { total: 3000 }),
      i18n.t('auth.planDesc8'),
      i18n.t('auth.planDesc9'),
      i18n.t('auth.planDesc3'),
      i18n.t('auth.planDesc4'),
      i18n.t('auth.planDesc5'),
      i18n.t('auth.planDesc11'),
    ],
    galaxy: [
      i18n.t('auth.planDesc1', { total: 3000 }),
      i18n.t('auth.planDesc2'),
      i18n.t('auth.planDesc7'),
      i18n.t('auth.planDesc8'),
      i18n.t('auth.planDesc10'),
      i18n.t('auth.planDesc11'),
      i18n.t('auth.planDesc9'),
      i18n.t('auth.planDesc12'),
      i18n.t('auth.planDesc4'),
      i18n.t('auth.planDesc5'),
    ]
  };

  return featuresMap[member];
}
