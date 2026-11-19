import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../api/base';
import { CustomerAuthResponse, CustomerLoginDto, CustomerRegisterDto, customerAuthApi } from '../api/auth';

interface CustomerAuthContextType {
    customer: CustomerAuthResponse | null;
    isLoading: boolean;
    login: (data: CustomerLoginDto) => Promise<void>;
    register: (data: CustomerRegisterDto) => Promise<void>;
    logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider = ({ children }: { children: ReactNode }) => {
    const [customer, setCustomer] = useState<CustomerAuthResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCustomer();
    }, []);

    const loadCustomer = async () => {
        try {
            const stored = await AsyncStorage.getItem('customer_user');
            if (stored) {
                const parsed = JSON.parse(stored) as CustomerAuthResponse;
                setCustomer(parsed);
                setAuthToken(parsed.token);
            }
        } catch (e) {
            console.error("Failed to load customer", e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (data: CustomerLoginDto) => {
        const res = await customerAuthApi.login(data);
        const user = res.data;
        setCustomer(user);
        setAuthToken(user.token);
        await AsyncStorage.setItem('customer_user', JSON.stringify(user));
    };

    const register = async (data: CustomerRegisterDto) => {
        const res = await customerAuthApi.register(data);
        const user = res.data;
        setCustomer(user);
        setAuthToken(user.token);
        await AsyncStorage.setItem('customer_user', JSON.stringify(user));
    };

    const logout = async () => {
        setCustomer(null);
        setAuthToken(null);
        await AsyncStorage.removeItem('customer_user');
    };

    return (
        <CustomerAuthContext.Provider value={{ customer, isLoading, login, register, logout }}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

export const useCustomerAuth = () => {
    const context = useContext(CustomerAuthContext);
    if (!context) throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
    return context;
};
