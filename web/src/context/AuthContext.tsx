"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setAuthToken } from '@/lib/api/client';
import { authApi, AuthResponse } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: AuthResponse | null;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('s3t_auth');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
                setAuthToken(parsed.token);
            } catch (e) {
                localStorage.removeItem('s3t_auth');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (data: any) => {
        const res = await authApi.login(data);
        setUser(res);
        setAuthToken(res.token);
        localStorage.setItem('s3t_auth', JSON.stringify(res));
    };

    const register = async (data: any) => {
        const res = await authApi.register(data);
        setUser(res);
        setAuthToken(res.token);
        localStorage.setItem('s3t_auth', JSON.stringify(res));
    };

    const logout = () => {
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem('s3t_auth');
        router.push('/auth/login');
    };

    const updateProfile = async (data: any) => {
        const res = await authApi.updateProfile(data);
        const updatedUser = { ...user, ...res, token: user?.token || res.token };
        setUser(updatedUser);
        localStorage.setItem('s3t_auth', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
