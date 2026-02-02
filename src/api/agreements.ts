import type { AgreementDraft } from '../types/agreement';
import type { AgreementResponse } from '../types/api';
import { api } from './base';

export type CreateAgreementRequest = {
  customerName: string;
  phone: string;
  fromDate: string;
  toDate: string;
  busType: string;
  busCount: string;
  passengers: string;
  placesToCover: string;

  // Rent details
  perDayRent: string;
  includeMountainRent: boolean;
  mountainRent: string;
  useIndividualBusRates: boolean;
  busRates: Array<{
    perDayRent: string;
    includeMountainRent: boolean;
    mountainRent: string;
  }>;

  totalAmount: string;
  advancePaid: string;
  notes: string;
};

function toCreateRequest(draft: AgreementDraft): CreateAgreementRequest {
  return {
    customerName: draft.customerName,
    phone: draft.phone,
    fromDate: draft.fromDate,
    toDate: draft.toDate,
    busType: draft.busType,
    busCount: draft.busCount,
    passengers: draft.passengers,
    placesToCover: draft.placesToCover,

    perDayRent: draft.perDayRent,
    includeMountainRent: draft.includeMountainRent,
    mountainRent: draft.mountainRent,
    useIndividualBusRates: draft.useIndividualBusRates,
    busRates: (draft.individualBusRates ?? []).map((r) => ({
      perDayRent: r.perDayRent,
      includeMountainRent: r.includeMountainRent,
      mountainRent: r.mountainRent,
    })),

    totalAmount: draft.totalAmount,
    advancePaid: draft.advancePaid,
    notes: draft.notes,
  };
}

export async function createAgreement(draft: AgreementDraft): Promise<AgreementResponse> {
  return api.post<AgreementResponse>('/api/agreements', toCreateRequest(draft));
}

export type ListAgreementsOptions = {
  includeCancelled?: boolean;
};

export async function listAgreements(options?: ListAgreementsOptions): Promise<AgreementResponse[]> {
  const qs = new URLSearchParams();
  if (options?.includeCancelled) qs.set('includeCancelled', 'true');
  const path = `/api/agreements${qs.toString() ? `?${qs.toString()}` : ''}`;
  return api.get<AgreementResponse[]>(path);
}

export async function getAgreementById(id: string): Promise<AgreementResponse> {
  return api.get<AgreementResponse>(`/api/agreements/${encodeURIComponent(id)}`);
}

export async function cancelAgreement(id: string): Promise<void> {
  return api.delete<void>(`/api/agreements/${encodeURIComponent(id)}`);
}

// Backward-compatible name (old behavior was hard-delete; backend now soft-cancels)
export async function deleteAgreement(id: string): Promise<void> {
  return cancelAgreement(id);
}

export async function addAdvanceToAgreement(
  id: string,
  amount: string,
  note?: string,
): Promise<AgreementResponse> {
  return api.post<AgreementResponse>(
    `/api/agreements/${encodeURIComponent(id)}/advance`,
    { amount, note: note ?? '' }
  );
}

export async function updateAgreement(id: string, request: CreateAgreementRequest): Promise<AgreementResponse> {
  return api.put<AgreementResponse>(`/api/agreements/${encodeURIComponent(id)}`, request);
}

export async function assignBusToAgreement(id: string, busId: string): Promise<AgreementResponse> {
  return api.post<AgreementResponse>(
    `/api/agreements/${encodeURIComponent(id)}/assign-bus`,
    { busId }
  );
}

export async function unassignBusFromAgreement(id: string, busId: string): Promise<AgreementResponse> {
  return api.post<AgreementResponse>(
    `/api/agreements/${encodeURIComponent(id)}/unassign-bus`,
    { busId }
  );
}
