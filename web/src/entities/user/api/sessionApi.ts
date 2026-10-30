import { apiClient, type ApiResponse } from '@/shared/api/client';
import { identityApi, vendorsApi } from '@/shared/api/gateway';
import { config } from '@/shared/config/env';
import type { VendorStatus } from '../model/userContext';
import { currentDemoAccount } from './demoAccounts';
import type { AccountInfo, LoginResponse } from './types';

/** identity-service `/api/auth/*`. */
export const authApi = `${identityApi}/auth`;
const accountsMeApi = `${identityApi}/accounts/me`;

export async function refreshAuthToken(refreshToken: string): Promise<LoginResponse> {
  if (config.demoMode) {
    const acc = currentDemoAccount();
    return {
      token: `demo-${acc?.username ?? 'guest'}`,
      refreshToken: 'demo',
      accountId: acc?.username ?? 'guest',
      email: acc?.username,
      fullName: acc?.fullName,
      role: acc?.role ?? 'BUYER',
    };
  }
  const response = await apiClient.post<ApiResponse<LoginResponse>>(`${authApi}/refresh-token`, { refreshToken });
  return response.data.data;
}

export async function getMyAccount(): Promise<AccountInfo> {
  if (config.demoMode) {
    const acc = currentDemoAccount();
    return {
      accountId: acc?.username ?? '',
      email: acc?.username ?? '',
      fullName: acc?.fullName ?? '',
      role: acc?.role ?? 'BUYER',
    };
  }
  const response = await apiClient.get<ApiResponse<AccountInfo>>(accountsMeApi);
  return response.data.data;
}

interface VendorSummaryDto {
  id: string;
  status: string;
}

interface VendorDetailDto {
  id: string;
  status: string;
  canOperate: boolean;
}

/** Resolves whether the logged-in account has no vendor ('none'), a pending/approved-unpaid profile ('pending'), or an open shop ('open'). */
export async function fetchMyVendorStatus(): Promise<VendorStatus> {
  if (config.demoMode) return currentDemoAccount()?.vendorStatus ?? 'none';
  try {
    const listRes = await apiClient.get<ApiResponse<VendorSummaryDto[]>>(vendorsApi, {
      params: { ownerAccountId: 'me' },
    });
    const first = listRes.data.data?.[0];
    if (!first) return 'none';
    if (first.status === 'APPROVED') {
      const detailRes = await apiClient.get<ApiResponse<VendorDetailDto>>(`${vendorsApi}/${encodeURIComponent(first.id)}`);
      return detailRes.data.data?.canOperate ? 'open' : 'pending';
    }
    return 'pending';
  } catch {
    return 'none';
  }
}
