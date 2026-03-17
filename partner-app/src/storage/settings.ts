import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SupportedLanguage } from '../i18n/resources';

const KEY_LANGUAGE = 'settings.language';

export async function getSavedLanguage(): Promise<SupportedLanguage | null> {
  const value = await AsyncStorage.getItem(KEY_LANGUAGE);
  if (value === 'en' || value === 'ta') return value;
  return null;
}

export async function setSavedLanguage(lang: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(KEY_LANGUAGE, lang);
}

