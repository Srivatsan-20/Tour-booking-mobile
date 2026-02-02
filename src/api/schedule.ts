import type { ScheduleResponse } from '../types/api';
import { api } from './base';

export async function getSchedule(fromIso: string, toIso: string): Promise<ScheduleResponse> {
  const qs = new URLSearchParams({ from: fromIso, to: toIso });
  return api.get<ScheduleResponse>(`/api/schedule?${qs.toString()}`);
}

