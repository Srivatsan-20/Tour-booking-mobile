import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_AUTH_TOKEN = 'auth.token';

export async function getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEY_AUTH_TOKEN);
}

export async function setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEY_AUTH_TOKEN, token);
}

export async function removeAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(KEY_AUTH_TOKEN);
}
