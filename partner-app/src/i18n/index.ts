import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getSavedLanguage, setSavedLanguage } from '../storage/settings';
import { resources, type SupportedLanguage } from './resources';

const fallbackLng: SupportedLanguage = 'en';

function detectDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    const locale = locales?.[0]?.languageCode;
    if (locale === 'ta') return 'ta';
  } catch (err) {
    console.warn('Failed to detect device language, using fallback:', err);
  }
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
  try {
    const saved = await getSavedLanguage();
    const lng = saved ?? detectDeviceLanguage();
    await i18n.changeLanguage(lng);
  } catch (err) {
    console.warn('Failed to bootstrap i18n, continuing with fallback:', err);
  }
}

export async function changeLanguage(lng: SupportedLanguage): Promise<void> {
  try {
    await i18n.changeLanguage(lng);
    await setSavedLanguage(lng);
  } catch (err) {
    console.warn('Failed to change language:', err);
  }
}

export { i18n };
