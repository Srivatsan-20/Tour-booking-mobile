import type { BusResponse } from '../types/api';
import { api } from './base';

type CreateBusRequest = {
  vehicleNumber: string;
  name?: string;
};

export async function listBuses(options?: { includeInactive?: boolean }): Promise<BusResponse[]> {
  const qs = new URLSearchParams();
  if (options?.includeInactive) qs.set('includeInactive', 'true');
  const path = `/api/buses${qs.toString() ? `?${qs.toString()}` : ''}`;
  return api.get<BusResponse[]>(path);
}

export async function createBus(vehicleNumber: string, name?: string): Promise<BusResponse> {
  const payload: CreateBusRequest = {
    vehicleNumber,
    ...(name ? { name } : {}),
  };
  return api.post<BusResponse>('/api/buses', payload);
}

export async function deleteBus(busId: string): Promise<BusResponse> {
  return api.delete<BusResponse>(`/api/buses/${busId}`);
}

