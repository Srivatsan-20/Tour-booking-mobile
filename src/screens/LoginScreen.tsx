import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/auth';
import { KeyboardAvoidingScrollView } from '../components/KeyboardAvoidingScrollView';

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
                <Text style={styles.title}>Tour Booking</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter password"
                        placeholderTextColor="#999"
                    />

                    <TouchableOpacity
                        style={[styles.button, isSubmitting && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
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
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    content: {
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 48,
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    button: {
        backgroundColor: '#2563eb', // Nice blue
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
