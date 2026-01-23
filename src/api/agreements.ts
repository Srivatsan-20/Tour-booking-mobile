import type { AgreementDraft } from '../types/agreement';
import type { AgreementResponse } from '../types/api';
import { getApiBaseUrl } from './config';
import { ApiError, readErrorResponse } from './ApiError';

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

async function throwApiError(res: Response): Promise<never> {
  const err = await readErrorResponse(res);
  throw new ApiError(res.status, err.message, err.body);
}

export async function createAgreement(draft: AgreementDraft): Promise<AgreementResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/agreements`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toCreateRequest(draft)),
    });
  } catch (e: any) {
    // Provide a more actionable message (especially on Android where the default is just
    // "Network request failed").
    if (__DEV__) {
      throw new Error(
        `Network request failed. Tried: ${url}.\n` +
          `Tip: ensure your API is running and set EXPO_PUBLIC_API_BASE_URL to your PC IP (example: http://192.168.1.18:5115).`,
      );
    }
    throw new Error('Network request failed');
  }

  if (!res.ok) {
    await throwApiError(res);
  }

  return (await res.json()) as AgreementResponse;
}

export type ListAgreementsOptions = {
  includeCancelled?: boolean;
};

export async function listAgreements(options?: ListAgreementsOptions): Promise<AgreementResponse[]> {
  const baseUrl = await getApiBaseUrl();
  const qs = new URLSearchParams();
  if (options?.includeCancelled) qs.set('includeCancelled', 'true');
  const url = `${baseUrl}/api/agreements${qs.toString() ? `?${qs.toString()}` : ''}`;

  let res: Response;
  try {
    res = await fetch(url, { method: 'GET' });
  } catch (e: any) {
    if (__DEV__) {
      throw new Error(
        `Network request failed. Tried: ${url}.\n` +
          `Tip: ensure your API is running and your phone can open Swagger in the browser.`,
      );
    }
    throw new Error('Network request failed');
  }

  if (!res.ok) {
    await throwApiError(res);
  }

  return (await res.json()) as AgreementResponse[];
}

export async function getAgreementById(id: string): Promise<AgreementResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/agreements/${encodeURIComponent(id)}`;

  let res: Response;
  try {
    res = await fetch(url, { method: 'GET' });
  } catch (e: any) {
    if (__DEV__) {
      throw new Error(`Network request failed. Tried: ${url}.`);
    }
    throw new Error('Network request failed');
  }

  if (!res.ok) {
    await throwApiError(res);
  }

  return (await res.json()) as AgreementResponse;
}

export async function cancelAgreement(id: string): Promise<void> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/agreements/${encodeURIComponent(id)}`;

  let res: Response;
  try {
    res = await fetch(url, { method: 'DELETE' });
  } catch (e: any) {
    if (__DEV__) {
      throw new Error(`Network request failed. Tried: ${url}.`);
    }
    throw new Error('Network request failed');
  }

  if (!res.ok) {
    await throwApiError(res);
  }
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
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/agreements/${encodeURIComponent(id)}/advance`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, note: note ?? '' }),
    });
  } catch (e: any) {
    if (__DEV__) {
      throw new Error(`Network request failed. Tried: ${url}.`);
    }
    throw new Error('Network request failed');
  }

  if (!res.ok) {
    await throwApiError(res);
  }

  return (await res.json()) as AgreementResponse;
}

export async function updateAgreement(id: string, request: CreateAgreementRequest): Promise<AgreementResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/agreements/${encodeURIComponent(id)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch (e: any) {
    if (__DEV__) {
      throw new Error(`Network request failed. Tried: ${url}.`);
    }
    throw new Error('Network request failed');
  }

  if (!res.ok) {
    await throwApiError(res);
  }

  return (await res.json()) as AgreementResponse;
}

export async function assignBusToAgreement(id: string, busId: string): Promise<AgreementResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/agreements/${encodeURIComponent(id)}/assign-bus`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ busId }),
  });

  if (!res.ok) await throwApiError(res);
  return (await res.json()) as AgreementResponse;
}

export async function unassignBusFromAgreement(id: string, busId: string): Promise<AgreementResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/agreements/${encodeURIComponent(id)}/unassign-bus`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ busId }),
  });

  if (!res.ok) await throwApiError(res);
  return (await res.json()) as AgreementResponse;
}
