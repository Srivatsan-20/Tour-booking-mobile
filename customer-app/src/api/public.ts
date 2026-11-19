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

export interface BookingResponse {
    agreementId: string;
    bookingId: number;
    status: string;
}

export const publicApi = {
    search: (params: SearchParams) => {
        const q = new URLSearchParams();
        q.set('fromDate', params.fromDate);
        q.set('toDate', params.toDate);
        if (params.city) q.set('city', params.city);
        if (params.type) q.set('type', params.type);
        return api.get<PublicBusDto[]>(`/api/public/search?${q.toString()}`);
    },
    getBus: (id: string) => api.get<PublicBusDto>(`/api/public/bus/${id}`),
    book: (data: BookingRequest) => api.post<BookingResponse>('/api/public/book', data),
};
