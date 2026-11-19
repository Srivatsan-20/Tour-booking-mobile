import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { Theme } from '../theme';
import { HeritageButton } from '../components/HeritageButton';
import { User, Phone, Lock, Mail, ArrowLeft } from 'lucide-react-native';

export const RegisterScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useCustomerAuth();

    const sanitizePhone = (input: string) => {
        let clean = input.replace(/[^\d+]/g, '').trim();
        if (clean.startsWith('+91')) {
            clean = clean.substring(3);
        } else if (clean.startsWith('91') && clean.length === 12) {
            clean = clean.substring(2);
        } else if (clean.startsWith('0') && clean.length === 11) {
            clean = clean.substring(1);
        }
        return clean.trim();
    };

    const handleRegister = async () => {
        const cleanPhone = sanitizePhone(phone);
        const cleanName = name.trim();
        const cleanPassword = password.trim();

        if (!cleanName || !cleanPhone || !cleanPassword) {
            Alert.alert("Required", "Please fill in Name, Phone and Password");
            return;
        }

        setLoading(true);
        try {
            await register({ name: cleanName, phone: cleanPhone, email: email.trim() || undefined, password: cleanPassword });
            navigation.navigate('Search');
        } catch (error: any) {
            console.error("Register error:", error);
            const msg = error.response?.data || error.message || "Could not create account";
            Alert.alert("Registration Failed", typeof msg === 'string' ? msg : "Could not create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft color={Theme.colors.gold} size={24} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the Sri Sai Senthil legacy</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                        <User size={20} color={Theme.colors.gold} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            placeholderTextColor={Theme.colors.textMuted}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Phone size={20} color={Theme.colors.gold} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            placeholderTextColor={Theme.colors.textMuted}
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Mail size={20} color={Theme.colors.gold} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address (Optional)"
                            placeholderTextColor={Theme.colors.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Lock size={20} color={Theme.colors.gold} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Set Password"
                            placeholderTextColor={Theme.colors.textMuted}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <HeritageButton
                        title="Create Account"
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.registerBtn}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.linkText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scroll: {
        flexGrow: 1,
        padding: Theme.spacing.lg,
        paddingTop: 60,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontFamily: Theme.fonts.serif,
        fontSize: 32,
        color: '#FFF',
    },
    subtitle: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 16,
        color: Theme.colors.textMuted,
        marginTop: 8,
    },
    form: {
        width: '100%',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        color: '#FFF',
        fontFamily: Theme.fonts.sansMedium,
        fontSize: 16,
    },
    registerBtn: {
        marginTop: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        fontFamily: Theme.fonts.sansRegular,
        color: Theme.colors.textMuted,
        fontSize: 14,
    },
    linkText: {
        fontFamily: Theme.fonts.sansBold,
        color: Theme.colors.gold,
        fontSize: 14,
    },
});
