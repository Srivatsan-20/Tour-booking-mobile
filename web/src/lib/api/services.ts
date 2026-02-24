import { api } from './client';
import { AgreementResponse, AccountsSummaryItem, BusResponse, ScheduleResponse, AgreementAccountsResponse } from '@/types/api';

export const agreementsApi = {
    list: (params?: { includeCancelled?: boolean }) => {
        const qs = params?.includeCancelled ? '?includeCancelled=true' : '';
        return api.get<AgreementResponse[]>(`/api/agreements${qs}`);
    },
    getById: (id: string) => api.get<AgreementResponse>(`/api/agreements/${id}`),
    create: (data: any) => api.post<AgreementResponse>('/api/agreements', data),
    update: (id: string, data: any) => api.put<AgreementResponse>(`/api/agreements/${id}`, data),
    cancel: (id: string) => api.delete(`/api/agreements/${id}`),
    addAdvance: (id: string, data: { amount: string; note?: string }) =>
        api.post<AgreementResponse>(`/api/agreements/${id}/advance`, data),
    assignBus: (id: string, busId: string) => api.post<AgreementResponse>(`/api/agreements/${id}/assign-bus`, { busId }),
    unassignBus: (id: string, busId: string) => api.post<AgreementResponse>(`/api/agreements/${id}/unassign-bus`, { busId }),
};

export const accountsApi = {
    getSummary: () => api.get<AccountsSummaryItem[]>('/api/accounts/summary'),
    getByAgreementId: (id: string) => api.get<AgreementAccountsResponse>(`/api/accounts/agreement/${id}`),
    upsert: (id: string, data: any) => api.post<AgreementAccountsResponse>(`/api/accounts/agreement/${id}`, data),
};

export const busesApi = {
    list: (params?: { includeInactive?: boolean }) => {
        const qs = params?.includeInactive ? '?includeInactive=true' : '';
        return api.get<BusResponse[]>(`/api/buses${qs}`);
    },
    create: (data: { vehicleNumber: string; name?: string; busType?: string; capacity?: number; baseRate?: number; homeCity?: string }) =>
        api.post<BusResponse>('/api/buses', data),
    update: (id: string, data: { vehicleNumber?: string; name?: string; busType?: string; capacity?: number; baseRate?: number; homeCity?: string }) =>
        api.put<BusResponse>(`/api/buses/${id}`, data),
    delete: (id: string) =>
        api.delete<BusResponse>(`/api/buses/${id}`),
};

export const scheduleApi = {
    get: (from: string, to: string) => api.get<ScheduleResponse>(`/api/schedule?from=${from}&to=${to}`),
};

export const settingsApi = {
    list: () => api.get<any[]>('/api/settings'),
    update: (data: { key: string; value: string; group?: string }) => api.post('/api/settings', data),
};
