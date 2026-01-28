import * as React from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZE, SHADOWS, GLOBAL_STYLES } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const MENU_ITEMS = [
    {
      title: t('home.newAgreement'),
      icon: 'file-document-edit',
      route: 'AgreementForm',
      color: '#2563EB', // Blue
    },
    {
      title: t('home.viewBookings'),
      icon: 'calendar-month',
      route: 'Bookings',
      color: '#059669', // Green
    },
    {
      title: t('home.viewAllTours'),
      icon: 'bus-marker',
      route: 'AllTours',
      color: '#7C3AED', // Purple
    },
    {
      title: t('home.busAvailability'),
      icon: 'bus-clock',
      route: 'BusAvailability',
      color: '#D97706', // Amber
    },
    {
      title: t('home.manageAssignments'),
      icon: 'steering',
      route: 'ManageAssignments',
      color: '#4B5563', // Grey
    },
    {
      title: t('home.accounts'),
      icon: 'finance',
      route: 'AccountsSummary',
      color: '#DC2626', // Red
    },
    {
      title: t('home.viewCancelledTours'),
      icon: 'cancel',
      route: 'CancelledTours',
      color: '#9CA3AF',
    }
  ];

  return (
    <View style={GLOBAL_STYLES.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.appName}>Tour Booking</Text>
        </View>

        <View style={styles.grid}>
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.card,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
              ]}
              onPress={() => navigation.navigate(item.route as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <MaterialCommunityIcons name={item.icon as any} size={32} color="white" />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} style={styles.chevron} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.8 }
          ]}
          onPress={signOut}
        >
          <MaterialCommunityIcons name="logout" size={24} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  welcomeText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  appName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  grid: {
    gap: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.card,
    minHeight: 80, // Generous touch target
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardTitle: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chevron: {
    opacity: 0.5,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.textSecondary,
    marginTop: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  logoutText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: 'white',
  }
});
