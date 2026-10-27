import { apiClient, type ApiResponse } from '../../../shared/api/client';
import { identityApi, vendorsApi } from '../../../shared/api/gateway';
import { config } from '../../../shared/config/env';
import {
  currentDemoAccount,
  demoLogin,
  demoRegister,
  demoResetPassword,
  demoSendOtp,
  demoVerifyAccount,
} from './demoAccounts';

const AUTH_BASE = `${identityApi}/auth`;
const ACCOUNTS_ME_PATH = `${identityApi}/accounts/me`;

export interface LoginResponse {
  token: string;
  refreshToken: string;
  accountId: string;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
  role: string;
}

export interface RegisterRequest {
  email: string;
  fullName: string;
  phoneNumber?: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  phoneNumber?: string;
  verified: boolean;
  otpSent: boolean;
}

export interface AccountInfo {
  accountId: string;
  email: string;
  phoneNumber?: string;
  fullName?: string;
  role: string;
}

/** `username` is the e-mail or the phone number (FR-02). */
export async function login(username: string, password: string): Promise<LoginResponse> {
  if (config.demoMode) return demoLogin(username, password);
  const response = await apiClient.post<ApiResponse<LoginResponse>>(`${AUTH_BASE}/login`, { username, password });
  return response.data.data;
}

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
  const response = await apiClient.post<ApiResponse<LoginResponse>>(`${AUTH_BASE}/refresh-token`, { refreshToken });
  return response.data.data;
}

export async function register(input: RegisterRequest): Promise<RegisterResponse> {
  if (config.demoMode) return demoRegister(input);
  const payload = {
    email: input.email.trim(),
    fullName: input.fullName.trim(),
    ...(input.phoneNumber?.trim() ? { phoneNumber: input.phoneNumber.trim() } : {}),
    password: input.password,
  };
  const response = await apiClient.post<ApiResponse<RegisterResponse>>(`${AUTH_BASE}/register`, payload);
  return response.data.data;
}

export async function verifyAccount(email: string, otp: string): Promise<{ verified: boolean }> {
  if (config.demoMode) return demoVerifyAccount(email, otp);
  const response = await apiClient.post<ApiResponse<{ verified: boolean }>>(`${AUTH_BASE}/verify-account`, {
    email: email.trim(),
    otp: otp.trim(),
  });
  return response.data.data;
}

export async function sendVerifyAccountOtp(email: string): Promise<void> {
  if (config.demoMode) return demoSendOtp(email);
  await apiClient.post<ApiResponse<void>>(`${AUTH_BASE}/send-verify-account-otp`, { email: email.trim() });
}

export async function sendResetPasswordOtp(email: string): Promise<void> {
  if (config.demoMode) return demoSendOtp(email);
  await apiClient.post<ApiResponse<void>>(`${AUTH_BASE}/send-reset-password-otp`, { email: email.trim() });
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  if (config.demoMode) return demoResetPassword(email, otp, newPassword);
  await apiClient.post<ApiResponse<void>>(`${AUTH_BASE}/reset-password`, {
    email: email.trim(),
    otp: otp.trim(),
    newPassword,
  });
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
  const response = await apiClient.get<ApiResponse<AccountInfo>>(ACCOUNTS_ME_PATH);
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
export async function fetchMySellerStatus(): Promise<'none' | 'pending' | 'open'> {
  if (config.demoMode) return currentDemoAccount()?.sellerStatus ?? 'none';
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
