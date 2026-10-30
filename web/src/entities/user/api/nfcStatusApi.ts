import { apiClient, type ApiResponse } from '@/shared/api/client';
import { demoStore } from '@/shared/api/demo';
import { identityApi } from '@/shared/api/gateway';
import { config } from '@/shared/config/env';
import type { NfcStatusInfo } from '../model/nfcStatus';

const DEMO_DELAY_MS = 200;

/** Demo store key of the account's NFC state: `nfc:<account>`, written by the verification flow. */
export const nfcDemoAccountKey = () => `nfc:${demoStore.get<string>('account', '')}`;

function demoStatus(): Promise<NfcStatusInfo> {
  const verified = demoStore.get<boolean>(nfcDemoAccountKey(), false);
  const info: NfcStatusInfo = {
    nfcStatus: verified ? 'VERIFIED' : 'NOT_VERIFIED',
    legalName: verified ? demoStore.get<string>('name', '').toUpperCase() : null,
    idNumberMasked: verified ? '001*******234' : null,
    nfcVerifiedAt: verified ? demoStore.get<string>(`${nfcDemoAccountKey()}:at`, '2026-10-20T03:15:00Z') : null,
  };
  return new Promise((resolve) => setTimeout(() => resolve(info), DEMO_DELAY_MS));
}

/** FR-04 status of the logged-in account (identity-service `NfcController`). */
export async function getMyNfcStatus(): Promise<NfcStatusInfo> {
  if (config.demoMode) return demoStatus();
  const response = await apiClient.get<ApiResponse<NfcStatusInfo>>(`${identityApi}/nfc/status`);
  return response.data.data;
}
