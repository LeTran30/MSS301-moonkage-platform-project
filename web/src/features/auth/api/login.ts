import { apiClient, type ApiResponse } from '../../../shared/api/client';
import { identityApi } from '../../../shared/api/gateway';
import { config } from '../../../shared/config/env';
import { demoLogin } from './demoAccounts';

const LOGIN_PATH = `${identityApi}/auth/login`;

export interface LoginResponse {
  token: string;
  refreshToken: string;
  accountId: string;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
  role: string;
}

/** `username` is the e-mail or the phone number (FR-02). */
export async function login(username: string, password: string): Promise<LoginResponse> {
  if (config.demoMode) return demoLogin(username, password);
  const response = await apiClient.post<ApiResponse<LoginResponse>>(LOGIN_PATH, { username, password });
  return response.data.data;
}
