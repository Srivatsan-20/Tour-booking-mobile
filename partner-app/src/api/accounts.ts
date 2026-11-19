import { api } from './base';
import type {
  AccountsSummaryItem,
  AgreementAccountsResponse,
  UpsertAgreementAccountsRequest,
} from '../types/accounts';

export async function getAgreementAccounts(agreementId: string): Promise<AgreementAccountsResponse> {
  return api.get<AgreementAccountsResponse>(`/api/agreements/${encodeURIComponent(agreementId)}/accounts`);
}

export async function upsertAgreementAccounts(
  agreementId: string,
  payload: UpsertAgreementAccountsRequest,
): Promise<AgreementAccountsResponse> {
  return api.put<AgreementAccountsResponse>(
    `/api/agreements/${encodeURIComponent(agreementId)}/accounts`,
    payload
  );
}

export async function listAccounts(options?: {
  fromIso?: string;
  toIso?: string;
  includeCancelled?: boolean;
}): Promise<AccountsSummaryItem[]> {
  const qs = new URLSearchParams();
  if (options?.fromIso) qs.set('from', options.fromIso);
  if (options?.toIso) qs.set('to', options.toIso);
  if (options?.includeCancelled) qs.set('includeCancelled', 'true');
  const path = `/api/accounts${qs.toString() ? `?${qs.toString()}` : ''}`;
  return api.get<AccountsSummaryItem[]>(path);
}
