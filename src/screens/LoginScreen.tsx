import React, { useState } from 'react';
import { StyleSheet, View, Alert, Text, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/auth';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS, RADIUS } from '../theme';

import { Screen } from '../components/Screen';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { KeyboardAvoidingScrollView } from '../components/KeyboardAvoidingScrollView';

export function LoginScreen() {
    const { signIn } = useAuth();
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleLogin() {
        if (!username.trim() || !password.trim()) {
            Alert.alert(t('common.error'), t('auth.fillAllFields'));
            return;
        }

        setIsSubmitting(true);
        try {
            const { token } = await login({ username, password });
            await signIn(token);
        } catch (e: any) {
            Alert.alert(t('auth.loginFailed'), e.message || 'Unknown error');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Screen style={styles.container} unsafe>
            <KeyboardAvoidingScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.headerContainer}>
                    <View style={styles.logoContainer}>
                        <MaterialCommunityIcons name="bus-marker" size={64} color={COLORS.primary} />
                    </View>
                    <Text style={styles.title}>{t('common.appName')}</Text>
                    <Text style={styles.subtitle}>{t('auth.welcome')}</Text>
                </View>

                <View style={styles.formContainer}>
                    <Input
                        label={t('auth.username')}
                        value={username}
                        onChangeText={setUsername}
                        placeholder={t('auth.usernamePlaceholder')}
                        autoCapitalize="none"
                        leftIcon={<MaterialCommunityIcons name="account-outline" size={20} color={COLORS.textTertiary} />}
                    />

                    <Input
                        label={t('auth.password')}
                        value={password}
                        onChangeText={setPassword}
                        placeholder={t('auth.passwordPlaceholder')}
                        secureTextEntry
                        leftIcon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textTertiary} />}
                        containerStyle={{ marginTop: SPACING.sm }}
                    />

                    <Button
                        title={t('auth.signIn')}
                        onPress={handleLogin}
                        loading={isSubmitting}
                        style={styles.loginButton}
                        size="lg"
                    />
                </View>

                <Text style={styles.footerText}>
                    Version 1.0.0 • Tour Management System
                </Text>

            </KeyboardAvoidingScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: RADIUS.round,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
        ...SHADOWS.soft,
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textSecondary,
    },
    formContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        ...SHADOWS.medium,
        marginBottom: SPACING.xxl,
    },
    loginButton: {
        marginTop: SPACING.xl,
    },
    footerText: {
        textAlign: 'center',
        color: COLORS.textTertiary,
        fontSize: FONT_SIZE.sm,
    },
});
