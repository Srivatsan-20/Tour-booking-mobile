import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { bootstrapI18n } from './src/i18n';

export default function App() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    bootstrapI18n()
      .catch((err) => {
        console.warn('Error during i18n bootstrap:', err);
      })
      .finally(() => {
        if (isMounted) setReady(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaProvider>
      {!ready ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : (
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AuthProvider>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
});
