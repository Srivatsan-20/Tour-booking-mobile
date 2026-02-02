import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { KeyboardAvoidingScrollView } from '../components/KeyboardAvoidingScrollView';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export function LoginScreen() {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigation = useNavigation<any>();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!username || !password) {
            Alert.alert(t('common.validationTitle'), 'Username and password are required');
            return;
        }

        try {
            setIsSubmitting(true);
            await login({ username, password });
        } catch (e: any) {
            Alert.alert(t('common.errorTitle'), e.response?.data || 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScreenContainer>
            <KeyboardAvoidingScrollView>
                <View style={styles.content}>
                    <Text style={styles.title}>{t('auth.loginTitle')}</Text>

                    <View style={styles.form}>
                        <View style={styles.field}>
                            <Text style={styles.label}>{t('auth.username')}</Text>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>{t('auth.password')}</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <Pressable
                            style={[styles.primaryBtn, isSubmitting && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.primaryBtnText}>
                                {isSubmitting ? t('common.loading') : t('auth.loginBtn')}
                            </Text>
                        </Pressable>

                        <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkBtn}>
                            <Text style={styles.linkText}>{t('auth.dontHaveAccount')}</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingScrollView>
        </ScreenContainer>
    );
}

const styles = StyleSheet.create({
    content: { padding: 24, flex: 1, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 24, textAlign: 'center' },
    form: { gap: 16 },
    field: { gap: 6 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151' },
    input: {
        borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
        backgroundColor: 'white', color: '#111827'
    },
    primaryBtn: {
        backgroundColor: '#111827', paddingVertical: 16, borderRadius: 14,
        alignItems: 'center', marginTop: 8
    },
    primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    linkBtn: { padding: 12, alignItems: 'center' },
    linkText: { color: '#4F46E5', fontWeight: '600' }
});
