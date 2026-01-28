import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/auth';
import { KeyboardAvoidingScrollView } from '../components/KeyboardAvoidingScrollView';
import { COLORS, SPACING, FONT_SIZE, GLOBAL_STYLES } from '../theme';

export function LoginScreen() {
    const { signIn } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleLogin() {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        setIsSubmitting(true);
        try {
            const { token } = await login({ username, password });
            await signIn(token);
        } catch (e: any) {
            Alert.alert('Login Failed', e.message || 'Unknown error');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <KeyboardAvoidingScrollView contentContainerStyle={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="bus-side" size={48} color={COLORS.white} />
                    </View>
                    <Text style={styles.title}>Tour Booking</Text>
                    <Text style={styles.subtitle}>Sign in to access your business</Text>
                </View>

                <View style={styles.form}>
                    <View>
                        <Text style={GLOBAL_STYLES.label}>Username</Text>
                        <TextInput
                            style={GLOBAL_STYLES.input}
                            autoCapitalize="none"
                            value={username}
                            onChangeText={setUsername}
                            placeholder="e.g. admin"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>

                    <View>
                        <Text style={GLOBAL_STYLES.label}>Password</Text>
                        <TextInput
                            style={GLOBAL_STYLES.input}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>

                    <TouchableOpacity
                        style={[GLOBAL_STYLES.btnPrimary, isSubmitting && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={GLOBAL_STYLES.btnText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
    },
    content: {
        padding: SPACING.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        textAlign: 'center',
    },
    form: {
        gap: SPACING.md,
        backgroundColor: COLORS.surface,
        padding: SPACING.lg,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});
