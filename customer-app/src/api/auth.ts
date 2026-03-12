import { api } from './base';

export interface CustomerLoginDto {
    phone: string;
    password?: string;
}

export interface CustomerRegisterDto {
    name: string;
    phone: string;
    email?: string;
    password?: string;
}

export interface CustomerAuthResponse {
    id: number;
    name: string;
    phone: string;
    email: string;
    token: string;
}

export const customerAuthApi = {
    login: (data: CustomerLoginDto) => api.post<CustomerAuthResponse>('/api/customer/login', data),
    register: (data: CustomerRegisterDto) => api.post<CustomerAuthResponse>('/api/customer/register', data),
};
