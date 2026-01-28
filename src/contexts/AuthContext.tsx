import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuthToken, setAuthToken, removeAuthToken } from '../storage/auth';

type AuthContextType = {
    token: string | null;
    isLoading: boolean;
    signIn: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setTokenState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on startup
        getAuthToken().then((t) => {
            setTokenState(t);
            setIsLoading(false);
        });
    }, []);

    async function signIn(newToken: string) {
        await setAuthToken(newToken);
        setTokenState(newToken);
    }

    async function signOut() {
        await removeAuthToken();
        setTokenState(null);
    }

    return (
        <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
