import * as React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { changeLanguage } from '../i18n';
import type { SupportedLanguage } from '../i18n/resources';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = (i18n.language === 'ta' ? 'ta' : 'en') as SupportedLanguage;
  const next: SupportedLanguage = current === 'en' ? 'ta' : 'en';

  return (
    <Pressable
      accessibilityRole="button"
      style={styles.btn}
      onPress={() => changeLanguage(next)}
    >
      <Text style={styles.text}>{current === 'en' ? 'EN' : 'TA'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  text: {
    fontWeight: '600',
  },
});

