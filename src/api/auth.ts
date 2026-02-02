import { api } from './base';



export interface LoginDto {
    username: string;
    password: string;
}

export interface RegisterDto {
    username: string;
    password: string;
    email?: string;
    companyName: string;
    companyAddress: string;
    companyPhone: string;
}

export interface UpdateProfileDto {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    email?: string;
}

export interface AuthResponse {
    username: string;
    token: string;
    userId: number;
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    email?: string;
}

export const authApi = {
    login: (data: LoginDto) => api.post<AuthResponse>('/api/auth/login', data),
    register: (data: RegisterDto) => api.post<AuthResponse>('/api/auth/register', data),
    updateProfile: (data: UpdateProfileDto) => api.put<AuthResponse>('/api/auth/profile', data),
};
