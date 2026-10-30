import { authApi } from '@/entities/user';
import { apiClient, ApiError, type ApiResponse } from '@/shared/api/client';
import { config } from '@/shared/config/env';

const DEMO_DELAY_MS = 250;
const OTP_LENGTH = 6;

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

const demoAnswer = <T,>(answer: () => T): Promise<T> =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(answer());
      } catch (error) {
        reject(error);
      }
    }, DEMO_DELAY_MS),
  );

export async function registerAccount(input: RegisterRequest): Promise<RegisterResponse> {
  if (config.demoMode) {
    const email = input.email.trim().toLowerCase();
    return demoAnswer(() => ({ id: email, email, phoneNumber: input.phoneNumber, verified: false, otpSent: true }));
  }
  const payload = {
    email: input.email.trim(),
    fullName: input.fullName.trim(),
    ...(input.phoneNumber?.trim() ? { phoneNumber: input.phoneNumber.trim() } : {}),
    password: input.password,
  };
  const response = await apiClient.post<ApiResponse<RegisterResponse>>(`${authApi}/register`, payload);
  return response.data.data;
}

export async function verifyAccountOtp(email: string, otp: string): Promise<{ verified: boolean }> {
  if (config.demoMode) {
    return demoAnswer(() => {
      if (otp.trim().length !== OTP_LENGTH) throw new ApiError(400, 'OTP_INVALID', 'Mã xác nhận gồm 6 chữ số.');
      return { verified: true };
    });
  }
  const response = await apiClient.post<ApiResponse<{ verified: boolean }>>(`${authApi}/verify-account`, {
    email: email.trim(),
    otp: otp.trim(),
  });
  return response.data.data;
}

export async function resendVerifyAccountOtp(email: string): Promise<void> {
  if (config.demoMode) return demoAnswer(() => undefined);
  await apiClient.post<ApiResponse<void>>(`${authApi}/send-verify-account-otp`, { email: email.trim() });
}
