import {
  register,
  resetPassword,
  sendResetPasswordOtp,
  sendVerifyAccountOtp,
  verifyAccount,
  type RegisterRequest,
  type RegisterResponse,
} from '../api/login';

export type { RegisterRequest, RegisterResponse };

export function registerAccount(input: RegisterRequest): Promise<RegisterResponse> {
  return register(input);
}

export function verifyAccountOtp(email: string, otp: string): Promise<{ verified: boolean }> {
  return verifyAccount(email, otp);
}

export function resendVerifyAccountOtp(email: string): Promise<void> {
  return sendVerifyAccountOtp(email);
}

export function requestPasswordResetOtp(email: string): Promise<void> {
  return sendResetPasswordOtp(email);
}

export function confirmPasswordReset(email: string, otp: string, newPassword: string): Promise<void> {
  return resetPassword(email, otp, newPassword);
}
