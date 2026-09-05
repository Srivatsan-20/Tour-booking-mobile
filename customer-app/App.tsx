import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, LogBox } from 'react-native';
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

LogBox.ignoreAllLogs();
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

function Navigation() {
    const { customer } = useCustomerAuth();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Theme.colors.background },
                animation: 'slide_from_right'
            }}
        >
            {!customer ? (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="Search" component={SearchScreen} />
                    <Stack.Screen name="BusDetail" component={BusDetailScreen} />
                    <Stack.Screen name="BookingForm" component={BookingFormScreen} />
                    <Stack.Screen name="Payment" component={PaymentScreen} />
                    <Stack.Screen name="PaymentStatus" component={PaymentStatusScreen} />
                    <Stack.Screen name="History" component={HistoryScreen} />
                    <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="Search" component={SearchScreen} />
                    <Stack.Screen name="BusDetail" component={BusDetailScreen} />
                    <Stack.Screen name="BookingForm" component={BookingFormScreen} />
                    <Stack.Screen name="Payment" component={PaymentScreen} />
                    <Stack.Screen name="PaymentStatus" component={PaymentStatusScreen} />
                    <Stack.Screen name="History" component={HistoryScreen} />
                    <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}

export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);

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
        <CustomerAuthProvider>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                <StatusBar style="light" />
                <NavigationContainer>
                    <Navigation />
                </NavigationContainer>
            </View>
        </CustomerAuthProvider>
    );
}
