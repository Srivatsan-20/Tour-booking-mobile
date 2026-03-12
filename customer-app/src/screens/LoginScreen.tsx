import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert,
    TouchableOpacity
} from 'react-native';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { Theme } from '../theme';
import { HeritageButton } from '../components/HeritageButton';
import { Bus, Phone, Lock, ArrowRight } from 'lucide-react-native';

export const LoginScreen = ({ navigation }: any) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useCustomerAuth();

    const handleLogin = async () => {
        if (!phone || !password) {
            Alert.alert("Required", "Please enter both phone and password");
            return;
        }

        setLoading(true);
        try {
            await login({ phone, password });
            // Navigation handled by App.tsx logic on user state change
        } catch (error: any) {
            Alert.alert("Login Failed", error.response?.data || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.inner}>
                {/* Header / Logo */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Bus color={Theme.colors.gold} size={40} />
                    </View>
                    <Text style={styles.brandTitle}>SRI SAI SENTHIL</Text>
                    <Text style={styles.brandSubtitle}>HERITAGE TRAVELS</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.welcomeText}>Welcome Back</Text>
                    <Text style={styles.instructionText}>Login to manage your bookings</Text>

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
                        <Lock size={20} color={Theme.colors.gold} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={Theme.colors.textMuted}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <HeritageButton
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginBtn}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkText}>Register Now</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.guestAction}>
                        <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.navigate('Search')}>
                            <Text style={styles.ghostBtnText}>Continue as Guest</Text>
                            <ArrowRight size={16} color={Theme.colors.gold} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    inner: {
        flex: 1,
        padding: Theme.spacing.lg,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Theme.colors.goldMuted,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(197, 160, 89, 0.3)',
        marginBottom: 20,
    },
    brandTitle: {
        fontFamily: Theme.fonts.serif,
        fontSize: 28,
        color: '#FFF',
        letterSpacing: 2,
    },
    brandSubtitle: {
        fontFamily: Theme.fonts.sansBold,
        fontSize: 10,
        color: Theme.colors.gold,
        letterSpacing: 4,
        marginTop: 4,
    },
    form: {
        width: '100%',
    },
    welcomeText: {
        fontFamily: Theme.fonts.serif,
        fontSize: 24,
        color: '#FFF',
        marginBottom: 8,
    },
    instructionText: {
        fontFamily: Theme.fonts.sansRegular,
        fontSize: 14,
        color: Theme.colors.textMuted,
        marginBottom: 32,
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
    loginBtn: {
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
    guestAction: {
        marginTop: 40,
        alignItems: 'center',
    },
    ghostBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ghostBtnText: {
        fontFamily: Theme.fonts.sansBold,
        color: Theme.colors.gold,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
