import { apiClient, GATEWAY } from '@/shared/api';
import { isDemoMode } from '@/shared/config';

/**
 * The write side of the password reset (AC-01.6).
 *
 * The user entity owns the read and the shape of the user; the writes live
 * here because they change the credentials, not the user data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Send the OTP that authorises a password reset (AC-01.6).
 */
export async function sendResetPasswordOtp(email: string): Promise<void> {
  if (isDemoMode()) {
    return;
  }
  await apiClient.post(GATEWAY.IDENTITY.SEND_RESET_PASSWORD_OTP, { email });
}

/** Set a new password with the OTP (AC-01.6). */
export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string
): Promise<void> {
  if (isDemoMode()) {
    return;
  }
  await apiClient.post(GATEWAY.IDENTITY.RESET_PASSWORD, { email, otp, newPassword });
}
