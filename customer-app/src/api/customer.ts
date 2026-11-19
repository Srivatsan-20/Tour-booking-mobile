import { api } from './base';

export interface CustomerBookingDto {
    id: string;
    customerName: string;
    phone: string;
    fromDate: string;
    toDate: string;
    placesToCover: string;
    busType: string;
    totalAmount: number;
    advancePaid: number;
    balance: number;
    isCancelled: boolean;
    isCompleted: boolean;
    createdAtUtc: string;
    vehicleNumber?: string;
    busName?: string;
    companyName?: string;
}

export interface AgreementDataResponse {
    id: string;
    customerName: string;
    phone: string;
    fromDate: string;
    toDate: string;
    busType: string;
    busCount: number;
    passengers: number;
    placesToCover: string;
    perDayRent: number;
    totalAmount: number;
    advancePaid: number;
    balance: number;
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
}

export const customerApi = {
    getMyBookings: () => api.get<CustomerBookingDto[]>('/api/customer/my-bookings'),
    getBookingDetail: (id: string) => api.get<CustomerBookingDto>(`/api/customer/my-bookings/${id}`),
    getAgreementData: (id: string) => api.get<AgreementDataResponse>(`/api/customer/my-bookings/${id}/agreement-data`),
};
