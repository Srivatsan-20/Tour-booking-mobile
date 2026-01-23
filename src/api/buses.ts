import type { BusResponse } from '../types/api';
import { getApiBaseUrl } from './config';
import { ApiError, readErrorResponse } from './ApiError';

type CreateBusRequest = {
  vehicleNumber: string;
  name?: string;
};

async function throwApiError(res: Response): Promise<never> {
  const err = await readErrorResponse(res);
  throw new ApiError(res.status, err.message, err.body);
}

export async function listBuses(options?: { includeInactive?: boolean }): Promise<BusResponse[]> {
  const baseUrl = await getApiBaseUrl();
  const qs = new URLSearchParams();
  if (options?.includeInactive) qs.set('includeInactive', 'true');
  const url = `${baseUrl}/api/buses${qs.toString() ? `?${qs.toString()}` : ''}`;

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) await throwApiError(res);
  return (await res.json()) as BusResponse[];
}

export async function createBus(vehicleNumber: string, name?: string): Promise<BusResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/buses`;

  const payload: CreateBusRequest = {
    vehicleNumber,
    ...(name ? { name } : {}),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) await throwApiError(res);
  return (await res.json()) as BusResponse;
}

