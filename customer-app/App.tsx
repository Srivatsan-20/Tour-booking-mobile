import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, LogBox, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold
} from '@expo-google-fonts/playfair-display';
import {
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold
} from '@expo-google-fonts/outfit';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CustomerAuthProvider, useCustomerAuth } from './src/context/CustomerAuthContext';
import { Theme } from './src/theme';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { BusDetailScreen } from './src/screens/BusDetailScreen';
import { BookingFormScreen } from './src/screens/BookingFormScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';
import { PaymentStatusScreen } from './src/screens/PaymentStatusScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HistoryDetailScreen } from './src/screens/HistoryDetailScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

LogBox.ignoreAllLogs();
if (Platform.OS !== 'web') {
    SplashScreen.preventAutoHideAsync();
}

const Stack = createNativeStackNavigator();

function Navigation() {
    const { customer } = useCustomerAuth();
    
    let initialScreen = 'Login';
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.search) {
        try {
            const params = new URLSearchParams(window.location.search);
            const reqScreen = params.get('screen');
            if (reqScreen) initialScreen = reqScreen;
        } catch {
            // ignore
        }
    }

    return (
        <Stack.Navigator
            initialRouteName={initialScreen}
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Theme.colors.background },
                animation: 'slide_from_right'
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen 
                name="BusDetail" 
                component={BusDetailScreen} 
                initialParams={{ 
                    busId: 'd476be64-62fb-4ab2-9adf-f46d2382ac9a',
                    fromDate: '2026-09-10',
                    toDate: '2026-09-12'
                }} 
            />
            <Stack.Screen 
                name="BookingForm" 
                component={BookingFormScreen} 
                initialParams={{
                    bus: {
                        id: 'd476be64-62fb-4ab2-9adf-f46d2382ac9a',
                        name: 'Royal Heritage AC Sleeper',
                        vehicleNumber: 'TN 33 AA 2024',
                        companyName: 'Sri Sai Senthil Travels',
                        busType: 'AC Sleeper',
                        capacity: 36,
                        baseRate: 45
                    },
                    fromDate: '2026-09-10',
                    toDate: '2026-09-12'
                }}
            />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="PaymentStatus" component={PaymentStatusScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
    );
}

export default function App() {
    const [appIsReady, setAppIsReady] = useState(Platform.OS === 'web');

    useEffect(() => {
        async function prepare() {
            try {
                await Font.loadAsync({
                    PlayfairDisplay_400Regular,
                    PlayfairDisplay_700Bold,
                    Outfit_400Regular,
                    Outfit_500Medium,
                    Outfit_700Bold,
                });
            } catch (e) {
                console.warn(e);
            } finally {
                setAppIsReady(true);
            }
        }

        prepare();
    }, []);

    const onLayoutRootView = useCallback(async () => {
        if (appIsReady) {
            await SplashScreen.hideAsync();
        }
    }, [appIsReady]);

    if (!appIsReady) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <CustomerAuthProvider>
                <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                    <StatusBar style="light" />
                    <NavigationContainer>
                        <Navigation />
                    </NavigationContainer>
                </View>
            </CustomerAuthProvider>
        </SafeAreaProvider>
    );
}
