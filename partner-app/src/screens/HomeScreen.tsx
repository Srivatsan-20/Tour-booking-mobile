import * as React from 'react';
import { ScrollView, StyleSheet, Text, View, StatusBar, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  PlusCircle,
  BookOpen,
  Compass,
  XCircle,
  ClipboardList,
  PieChart,
  User,
  LogOut,
  AlertTriangle,
  CreditCard
} from 'lucide-react-native';

import type { RootStackParamList } from '../navigation/types';
import { DashboardCard } from '../components/DashboardCard';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  
  const isPending = user?.subscriptionStatus === 'Pending';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>{t('common.greeting', 'Welcome Back,')}</Text>
          <Text style={styles.appTitle}>{t('home.title', 'Tour Booking Manager')}</Text>
        </View>

        {isPending && (
          <View style={styles.alertBox}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={24} color="#EF4444" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.alertTitle}>Action Required: Subscription Pending</Text>
                <Text style={styles.alertText}>Your SaaS platform access is currently restricted. Please complete your subscription payment.</Text>
              </View>
            </View>
            {user?.systemPayLink && (
              <Pressable style={styles.payBtn} onPress={() => {/* In a real app, use Linking.openURL(user.systemPayLink) */}}>
                <CreditCard size={18} color="#FFFFFF" />
                <Text style={styles.payBtnText}>Pay Subscription</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Section: Booking Management */}
        <View style={styles.section}>
            title={t('home.newAgreement')}
            subtitle={t('home.newAgreementDesc', 'Create a new tour agreement')}
            icon={<PlusCircle size={24} color="#2563EB" />}
            color="#2563EB"
            onPress={() => navigation.navigate('AgreementForm')}
          />

          <DashboardCard
            title={t('home.viewBookings')}
            subtitle={t('home.viewBookingsDesc', 'Manage active bookings')}
            icon={<BookOpen size={24} color="#059669" />}
            color="#059669"
            onPress={() => navigation.navigate('Bookings')}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <DashboardCard
                title={t('home.viewAllTours')}
                subtitle={t('home.history', 'History')}
                icon={<Compass size={24} color="#7C3AED" />}
                color="#7C3AED"
                onPress={() => navigation.navigate('AllTours')}
                style={{ marginBottom: 0 }}
                layout="vertical"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <DashboardCard
                title={t('home.viewCancelledTours')}
                subtitle={t('home.archived', 'Archived')}
                icon={<XCircle size={24} color="#DC2626" />}
                color="#DC2626"
                onPress={() => navigation.navigate('CancelledTours')}
                style={{ marginBottom: 0 }}
                layout="vertical"
              />
            </View>
          </View>
        </View>

        {/* Section: Fleet Operations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.section.fleet', 'Fleet Operations')}</Text>

          <DashboardCard
            title={t('home.busAvailability')}
            subtitle={t('home.busAvailabilityDesc', 'Check bus schedules & availability')}
            icon={<Bus size={24} color="#EA580C" />}
            color="#EA580C"
            onPress={() => navigation.navigate('BusAvailability')}
          />

          <DashboardCard
            title={t('home.manageAssignments')}
            subtitle={t('home.manageAssignmentsDesc', 'Assign buses to upcoming tours')}
            icon={<ClipboardList size={24} color="#0891B2" />}
            color="#0891B2"
            onPress={() => navigation.navigate('ManageAssignments')}
          />
        </View>

        {/* Section: Finance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.section.account', 'Account')}</Text>

          <DashboardCard
            title={t('home.profile', 'Company Profile')}
            subtitle={t('home.profileDesc', 'Edit branding details')}
            icon={<User size={24} color="#4F46E5" />}
            color="#4F46E5"
            onPress={() => navigation.navigate('Profile')}
          />

          <DashboardCard
            title={t('home.financials')}
            subtitle={t('home.accountsDesc', 'View earnings and expenses')}
            icon={<PieChart size={24} color="#DB2777" />}
            color="#DB2777"
            onPress={() => navigation.navigate('AccountsSummary')}
          />
        </View>

        {/* Logout Button */}
        <DashboardCard
          title={t('auth.logout')}
          subtitle={user?.username || ''}
          icon={<LogOut size={24} color="#DC2626" />}
          color="#DC2626"
          onPress={logout}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light gray background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#D1D5DB',
    fontSize: 12,
  },
  alertBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
  },
  payBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
});


