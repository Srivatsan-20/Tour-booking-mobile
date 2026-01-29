import * as React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS, RADIUS } from '../theme';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const DASHBOARD_ITEMS = [
    {
      title: t('home.newAgreement'),
      subtitle: 'Create new booking',
      icon: 'file-document-edit',
      route: 'AgreementForm',
      color: COLORS.primary,
      bg: COLORS.primaryLight,
    },
    {
      title: t('home.viewBookings'),
      subtitle: 'Manage active trips',
      icon: 'calendar-month',
      route: 'Bookings',
      color: COLORS.success,
      bg: COLORS.successBg,
    },
    {
      title: t('home.viewAllTours'),
      subtitle: 'Master tour list',
      icon: 'bus-marker',
      route: 'AllTours',
      color: COLORS.info,
      bg: COLORS.infoBg,
    },
    {
      title: t('home.busAvailability'),
      subtitle: 'Check dates',
      icon: 'bus-clock',
      route: 'BusAvailability',
      color: COLORS.warning,
      bg: COLORS.warningBg,
    },
  ];

  const SECONDARY_ITEMS = [
    {
      title: t('home.manageAssignments'),
      icon: 'steering',
      route: 'ManageAssignments',
      color: COLORS.textSecondary,
    },
    {
      title: t('home.accounts'),
      icon: 'finance',
      route: 'AccountsSummary',
      color: COLORS.error,
    },
    {
      title: t('home.viewCancelledTours'),
      icon: 'cancel',
      route: 'CancelledTours',
      color: COLORS.textTertiary,
    },
  ];

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.appName}>Tour Manager</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats or Highlights could go here */}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {DASHBOARD_ITEMS.map((item, index) => (
            <Card
              key={index}
              style={styles.mainCard}
              onPress={() => navigation.navigate(item.route as any)}
              padding="md"
            >
              <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
            </Card>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.listContainer}>
          {SECONDARY_ITEMS.map((item, index) => (
            <Card
              key={index}
              style={styles.secondaryCard}
              onPress={() => navigation.navigate(item.route as any)}
              padding="md"
            >
              <View style={styles.row}>
                <View style={[styles.miniIcon, { backgroundColor: COLORS.background }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.secondaryTitle}>{item.title}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textTertiary} />
              </View>
            </Card>
          ))}
        </View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  welcomeText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  appName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  logoutBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.errorBg,
    borderRadius: RADIUS.round,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  mainCard: {
    width: '47%', // roughly half minus gap
    minHeight: 140,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  cardContent: {
    gap: 4,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  listContainer: {
    gap: SPACING.sm,
  },
  secondaryCard: {
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  secondaryTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
});
