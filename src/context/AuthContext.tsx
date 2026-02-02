import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../api/base';
import { AuthResponse, LoginDto, RegisterDto, UpdateProfileDto, authApi } from '../api/auth';

interface AuthContextType {
    user: AuthResponse | null;
    isLoading: boolean;
    login: (data: LoginDto) => Promise<void>;
    register: (data: RegisterDto) => Promise<void>;
    updateProfile: (data: UpdateProfileDto) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const stored = await AsyncStorage.getItem('auth_user');
            if (stored) {
                const parsed = JSON.parse(stored) as AuthResponse;
                setUser(parsed);
                setAuthToken(parsed.token);
            }
        } catch (e) {
            console.error("Failed to load user", e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (data: LoginDto) => {
        const res = await authApi.login(data);
        console.log('✅ Login successful, setting token:', res.token.substring(0, 20) + '...');
        setUser(res);
        setAuthToken(res.token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(res));
    };

    const register = async (data: RegisterDto) => {
        const res = await authApi.register(data);
        console.log('✅ Registration successful, setting token:', res.token.substring(0, 20) + '...');
        setUser(res);
        setAuthToken(res.token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(res));
    };

    const updateProfile = async (data: UpdateProfileDto) => {
        const res = await authApi.updateProfile(data);
        console.log('✅ Profile update successful');
        setUser(res);
        // Token might change or not, but let's update it to be safe if backend issues new one
        if (res.token) {
            setAuthToken(res.token);
        }
        await AsyncStorage.setItem('auth_user', JSON.stringify(res));
    };

    const logout = async () => {
        setUser(null);
        setAuthToken(null);
        await AsyncStorage.removeItem('auth_user');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, updateProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
