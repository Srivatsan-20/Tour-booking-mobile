import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getSavedLanguage, setSavedLanguage } from '../storage/settings';
import { resources, type SupportedLanguage } from './resources';

const fallbackLng: SupportedLanguage = 'en';

function detectDeviceLanguage(): SupportedLanguage {
  const locale = Localization.getLocales()?.[0]?.languageCode;
  if (locale === 'ta') return 'ta';
  return fallbackLng;
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: fallbackLng,
    fallbackLng,
    interpolation: { escapeValue: false },
  });
}

export async function bootstrapI18n(): Promise<void> {
  const saved = await getSavedLanguage();
  const lng = saved ?? detectDeviceLanguage();
  await i18n.changeLanguage(lng);
}

export async function changeLanguage(lng: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lng);
  await setSavedLanguage(lng);
}

export { i18n };

