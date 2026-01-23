import type { ScheduleResponse } from '../types/api';
import { getApiBaseUrl } from './config';
import { ApiError, readErrorResponse } from './ApiError';

async function throwApiError(res: Response): Promise<never> {
  const err = await readErrorResponse(res);
  throw new ApiError(res.status, err.message, err.body);
}

export async function getSchedule(fromIso: string, toIso: string): Promise<ScheduleResponse> {
  const baseUrl = await getApiBaseUrl();
  const qs = new URLSearchParams({ from: fromIso, to: toIso });
  const url = `${baseUrl}/api/schedule?${qs.toString()}`;

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) await throwApiError(res);
  return (await res.json()) as ScheduleResponse;
}

