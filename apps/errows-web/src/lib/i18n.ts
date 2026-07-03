import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import languageDetector from 'i18next-browser-languagedetector'
import cn from '@/locales/cn.json';
import us from '@/locales/us.json';
import kr from '@/locales/kr.json';
import jp from '@/locales/jp.json';
import de from '@/locales/de.json';
import { characterExamples } from '@/locales/character-examples';

const resources = {
  // 英文(美式)
  us: { translation: { ...us, characterExamples: characterExamples } },
  // 中文(简体)
  cn: { translation: { ...cn, characterExamples: characterExamples } },
  // 韩文
  kr: { translation: { ...kr, characterExamples: characterExamples } },
  // 日文
  jp: { translation: { ...jp, characterExamples: characterExamples } },
  // 德文
  de: { translation: { ...de, characterExamples: characterExamples } },
} as const;

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // 让语言检测器生效并持久化到 localStorage
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'i18nextLng',
    },
    // 移除固定的 lng，使用浏览器检测或缓存语言
    fallbackLng: 'us',
    supportedLngs: ['us', 'cn', 'kr', 'jp', 'de'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
