import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LanguageToggle } from '../components/LanguageToggle';
import { AgreementFormScreen } from '../screens/AgreementFormScreen';
import { AgreementPreviewScreen } from '../screens/AgreementPreviewScreen';
import { BookingDetailsScreen } from '../screens/BookingDetailsScreen';
import { BookingEditScreen } from '../screens/BookingEditScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { AllToursScreen } from '../screens/AllToursScreen';
import { CancelledToursScreen } from '../screens/CancelledToursScreen';
import { BusAvailabilityScreen } from '../screens/BusAvailabilityScreen';
import { ManageAssignmentsScreen } from '../screens/ManageAssignmentsScreen';
import { AccountsSummaryScreen } from '../screens/AccountsSummaryScreen';
import { TourAccountScreen } from '../screens/TourAccountScreen';
import { HomeScreen } from '../screens/HomeScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        headerRight: () => (
          <View style={styles.headerRight}>
            {route.name !== 'Home' ? (
              <Pressable
                accessibilityRole="button"
                style={styles.homeBtn}
                onPress={() => navigation.popToTop()}
              >
                <Text style={styles.homeBtnText}>{t('common.home')}</Text>
              </Pressable>
            ) : null}
						{/* Hide language toggle on Manage Assignments to avoid header clutter */}
						{route.name !== 'ManageAssignments' ? <LanguageToggle /> : null}
          </View>
        ),
      })}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AgreementForm" component={AgreementFormScreen} />
      <Stack.Screen name="AgreementPreview" component={AgreementPreviewScreen} />
      <Stack.Screen name="Bookings" component={BookingsScreen} />
      <Stack.Screen name="AllTours" component={AllToursScreen} />
      <Stack.Screen name="CancelledTours" component={CancelledToursScreen} />
      <Stack.Screen name="BusAvailability" component={BusAvailabilityScreen} />
      <Stack.Screen name="ManageAssignments" component={ManageAssignmentsScreen} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <Stack.Screen name="BookingEdit" component={BookingEditScreen} />

      <Stack.Screen name="AccountsSummary" component={AccountsSummaryScreen} />
      <Stack.Screen name="TourAccount" component={TourAccountScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  homeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  homeBtnText: { fontWeight: '700' },
});

