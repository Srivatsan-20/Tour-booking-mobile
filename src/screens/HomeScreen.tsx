import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.title')}</Text>

      <Pressable
        style={styles.btn}
        onPress={() => navigation.navigate('AgreementForm')}
      >
        <Text style={styles.btnText}>{t('home.newAgreement')}</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={() => navigation.navigate('Bookings')}>
        <Text style={styles.btnText}>{t('home.viewBookings')}</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={() => navigation.navigate('AllTours')}>
        <Text style={styles.btnText}>{t('home.viewAllTours')}</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={() => navigation.navigate('CancelledTours')}>
        <Text style={styles.btnText}>{t('home.viewCancelledTours')}</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={() => navigation.navigate('BusAvailability')}>
        <Text style={styles.btnText}>{t('home.busAvailability')}</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={() => navigation.navigate('ManageAssignments')}>
        <Text style={styles.btnText}>{t('home.manageAssignments')}</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={() => navigation.navigate('AccountsSummary')}>
        <Text style={styles.btnText}>{t('home.accounts')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 18 },
  btn: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

