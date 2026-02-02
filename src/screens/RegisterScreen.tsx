import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { KeyboardAvoidingScrollView } from '../components/KeyboardAvoidingScrollView';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export function RegisterScreen() {
    const { t } = useTranslation();
    const { register } = useAuth();
    const navigation = useNavigation<any>();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');


    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!username || !password || !companyName || !companyAddress || !companyPhone) {
            Alert.alert(t('common.validationTitle'), 'Please fill in all required fields (Username, Password, Company Details)');
            return;
        }

        try {
            setIsSubmitting(true);
            await register({ username, password, email, companyName, companyAddress, companyPhone });
        } catch (e: any) {
            console.error('Registration error:', e.response?.data || e.message);
            const errorMessage = typeof e.response?.data === 'string'
                ? e.response.data
                : (e.message || 'Registration failed due to an unknown error');
            Alert.alert(t('common.errorTitle'), errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScreenContainer>
            <KeyboardAvoidingScrollView>
                <View style={styles.content}>
                    <Text style={styles.title}>{t('auth.registerTitle')}</Text>

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
                            <Text style={styles.label}>{t('auth.email')} (optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>{t('auth.companyName', 'Company Name')}</Text>
                            <TextInput
                                style={styles.input}
                                value={companyName}
                                onChangeText={setCompanyName}
                                placeholder="e.g. Sri Sai Travels"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>{t('auth.companyAddress', 'Company Address')}</Text>
                            <TextInput
                                style={styles.input}
                                value={companyAddress}
                                onChangeText={setCompanyAddress}
                                multiline
                                placeholder="Full address"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>{t('auth.companyPhone', 'Company Phone/Cell')}</Text>
                            <TextInput
                                style={styles.input}
                                value={companyPhone}
                                onChangeText={setCompanyPhone}
                                keyboardType="phone-pad"
                                placeholder="e.g. 94438 49013"
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
                                {isSubmitting ? t('common.loading') : t('auth.registerBtn')}
                            </Text>
                        </Pressable>

                        <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkBtn}>
                            <Text style={styles.linkText}>{t('auth.haveAccount')}</Text>
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
