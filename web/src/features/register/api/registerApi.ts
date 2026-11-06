import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import type { RegisterDto } from '@/entities/user';

/**
 * The write side of creating an account (AC-01.1).
 *
 * The user entity owns the read and the shape of the user; the write lives
 * here because it creates the account, not the user data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Create an account (AC-01.1).
 *
 * The e-mail is required, the phone number is optional; the backend sends the
 * verification OTP afterwards.
 */
export async function registerAccount(payload: {
  email: string;
  phoneNumber?: string;
  fullName: string;
  password: string;
}): Promise<RegisterDto> {
  const res = await apiClient.post<unknown>(GATEWAY.IDENTITY.REGISTER, {
    email: payload.email,
    phoneNumber: payload.phoneNumber ?? '',
    fullName: payload.fullName,
    password: payload.password,
  });
  const dto = unwrap<RegisterDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về kết quả đăng ký.');
  }
  return dto;
}
