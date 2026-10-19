import { apiClient, type ApiResponse } from './client';
import { endpoints } from './endpoints';

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
  const response = await apiClient.post<ApiResponse<LoginResponse>>(endpoints.login, { username, password });
  return response.data.data;
}
