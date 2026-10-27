import { authApi } from '@/entities/user';
import { apiClient, ApiError, type ApiResponse } from '@/shared/api/client';
import { config } from '@/shared/config/env';

const DEMO_DELAY_MS = 250;
const OTP_LENGTH = 6;

export async function requestPasswordResetOtp(email: string): Promise<void> {
  if (config.demoMode) return new Promise((resolve) => setTimeout(resolve, DEMO_DELAY_MS));
  await apiClient.post<ApiResponse<void>>(`${authApi}/send-reset-password-otp`, { email: email.trim() });
}

export async function confirmPasswordReset(email: string, otp: string, newPassword: string): Promise<void> {
  if (config.demoMode) {
    return new Promise((resolve, reject) =>
      setTimeout(() => (otp.trim().length === OTP_LENGTH ? resolve() : reject(new ApiError(400, 'OTP_INVALID', 'Mã xác nhận gồm 6 chữ số.'))), DEMO_DELAY_MS),
    );
  }
  await apiClient.post<ApiResponse<void>>(`${authApi}/reset-password`, {
    email: email.trim(),
    otp: otp.trim(),
    newPassword,
  });
}
