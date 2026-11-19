"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const STORAGE_KEY = 's3t_customer_auth';

interface CustomerUser {
    id: number;
    name: string;
    phone: string;
    email: string;
    token: string;
}

interface CustomerAuthContextType {
    customer: CustomerUser | null;
    isLoading: boolean;
    login: (phone: string, password: string) => Promise<void>;
    register: (data: { name: string; phone: string; email?: string; password: string }) => Promise<void>;
    logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider = ({ children }: { children: ReactNode }) => {
    const [customer, setCustomer] = useState<CustomerUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { setCustomer(JSON.parse(stored)); } catch { localStorage.removeItem(STORAGE_KEY); }
        }
        setIsLoading(false);
    }, []);

    const login = async (phone: string, password: string) => {
        const res = await fetch(`${BASE_URL}/api/customer/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Invalid phone or password');
        }
        const data: CustomerUser = await res.json();
        setCustomer(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    const register = async (form: { name: string; phone: string; email?: string; password: string }) => {
        const res = await fetch(`${BASE_URL}/api/customer/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Registration failed');
        }
        const data: CustomerUser = await res.json();
        setCustomer(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    const logout = () => {
        setCustomer(null);
        localStorage.removeItem(STORAGE_KEY);
        router.push('/customer/login');
    };

    return (
        <CustomerAuthContext.Provider value={{ customer, isLoading, login, register, logout }}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

export const useCustomerAuth = () => {
    const ctx = useContext(CustomerAuthContext);
    if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
    return ctx;
};

// Helper: get auth headers for customer API calls
export const getCustomerHeaders = (): Record<string, string> => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const { token } = JSON.parse(stored);
            if (token) return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
        }
    } catch { }
    return { 'Content-Type': 'application/json' };
};
