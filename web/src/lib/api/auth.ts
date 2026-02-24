import { api } from './client';

export interface AuthResponse {
    token: string;
    userName: string;
    email?: string;
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
}

export const authApi = {
    login: (data: any) => api.post<AuthResponse>('/api/auth/login', data),
    register: (data: any) => api.post<AuthResponse>('/api/auth/register', data),
    updateProfile: (data: any) => api.put<AuthResponse>('/api/auth/profile', data),
};
