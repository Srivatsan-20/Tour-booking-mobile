import { api } from './base';

export interface PublicBusDto {
    id: string;
    name: string;
    vehicleNumber: string;
    companyName: string;
    baseRate: number;
    busType: string;
    capacity: number;
    upiLink?: string;
    driverCharges: number;
    tollCharges: number;
    fastTagCharges: number;
    otherCharges: number;
}

export interface SearchParams {
    fromDate: string; // yyyy-MM-dd
    toDate: string;
    city?: string;
    type?: string;
}

export interface BookingRequest {
    customerName: string;
    phone: string;
    fromDate: string;
    toDate: string;
    busId: string;
    passengers: number;
    placesToCover: string;
    paymentId?: string;
    totalAmount: number;
}

export const publicApi = {
    search: (params: SearchParams) => api.get<PublicBusDto[]>('/api/public/search', { params }),
    getBus: (id: string) => api.get<PublicBusDto>(`/api/public/bus/${id}`),
    book: (data: BookingRequest) => api.post('/api/public/book', data),
};
