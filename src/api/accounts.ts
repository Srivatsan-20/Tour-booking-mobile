import { getApiBaseUrl } from './config';
import { ApiError, readErrorResponse } from './ApiError';
import type {
  AccountsSummaryItem,
  AgreementAccountsResponse,
  UpsertAgreementAccountsRequest,
} from '../types/accounts';

async function throwApiError(res: Response): Promise<never> {
  const err = await readErrorResponse(res);
  throw new ApiError(res.status, err.message, err.body);
}

export async function getAgreementAccounts(agreementId: string): Promise<AgreementAccountsResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/agreements/${encodeURIComponent(agreementId)}/accounts`;

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) await throwApiError(res);
  return (await res.json()) as AgreementAccountsResponse;
}

export async function upsertAgreementAccounts(
  agreementId: string,
  payload: UpsertAgreementAccountsRequest,
): Promise<AgreementAccountsResponse> {
  const baseUrl = await getApiBaseUrl();
  const url = `${baseUrl}/api/agreements/${encodeURIComponent(agreementId)}/accounts`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) await throwApiError(res);
  return (await res.json()) as AgreementAccountsResponse;
}

export async function listAccounts(options?: {
  fromIso?: string;
  toIso?: string;
  includeCancelled?: boolean;
}): Promise<AccountsSummaryItem[]> {
  const baseUrl = await getApiBaseUrl();
  const qs = new URLSearchParams();
  if (options?.fromIso) qs.set('from', options.fromIso);
  if (options?.toIso) qs.set('to', options.toIso);
  if (options?.includeCancelled) qs.set('includeCancelled', 'true');
  const url = `${baseUrl}/api/accounts${qs.toString() ? `?${qs.toString()}` : ''}`;

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) await throwApiError(res);
  return (await res.json()) as AccountsSummaryItem[];
}
