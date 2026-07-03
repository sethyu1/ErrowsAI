/* eslint-disable react-refresh/only-export-components */
import { UsIcon, ChinaIcon, KoreaIcon, JapanIcon, GermanyIcon } from '@errows/icons';
import { addPrefix } from '@/utils';
import { Enum } from 'enum-plus';
import i18n from '@/lib/i18n';

export const VerifyEnum = Enum({
  /** 注册 */
  REGISTER: '1',
  /** 忘记密码 */
  FORGOT_PASSWORD: '2',
})

export function getGenderEnum() {
  return Enum({
    MALE: { value: 'male', label: i18n.t('common.male') },
    FEMALE: { value: 'female', label: i18n.t('common.female') },
    UNKNOWN: { value: 'unknown', label: i18n.t('common.unknown') },
  })
}

export const LocaleConfig = [
  {
    label: 'English',
    value: 'us',
    icon: <UsIcon />,
  },
  {
    label: '中文',
    value: 'cn',
    icon: <ChinaIcon />,
  },
  {
    label: '한국어',
    value: 'kr',
    icon: <KoreaIcon />,
  },
  {
    label: '日本語',
    value: 'jp',
    icon: <JapanIcon />,
  },
  {
    label: 'Deutsch',
    value: 'de',
    icon: <GermanyIcon />,
  },
]

export const SystemConfig = {
  /** 新模型数量 */
  newModels: 80,
  /** 免费金币数量 */
  freeCoins: 50,
  /** 订阅费用 */
  subscription: -0.53
}

export const STORAGE_KEYS = {
  TIPS: addPrefix('tips'),
  CHRISTMAS_SALE_LAST_SHOWN: addPrefix('christmas_sale_last_shown'),
  CHRISTMAS_SALE_NEW_USER: addPrefix('christmas_sale_new_user'),
}
