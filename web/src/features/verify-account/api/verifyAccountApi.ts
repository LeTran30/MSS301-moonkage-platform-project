import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import type { VerifyAccountDto } from '@/entities/user';

/**
 * The write side of confirming an account (AC-01.2).
 *
 * The user entity owns the read and the shape of the user; the write lives
 * here because it verifies the account, not the user data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Confirm the account with the OTP the backend sent (AC-01.2).
 *
 * The OTP belongs to the e-mail, not to the phone number.
 */
export async function verifyAccount(email: string, otp: string): Promise<VerifyAccountDto> {
  if (isDemoMode()) {
    return { id: 'usr_new', email, phoneNumber: '', verified: true };
  }
  const res = await apiClient.post<unknown>(GATEWAY.IDENTITY.VERIFY_ACCOUNT, { email, otp });
  const dto = unwrap<VerifyAccountDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về kết quả xác minh.');
  }
  return dto;
}

/** Send the verification OTP again (AC-01.2). */
export async function sendVerifyAccountOtp(email: string): Promise<void> {
  if (isDemoMode()) {
    return;
  }
  await apiClient.post(GATEWAY.IDENTITY.SEND_VERIFY_ACCOUNT_OTP, { email });
}
