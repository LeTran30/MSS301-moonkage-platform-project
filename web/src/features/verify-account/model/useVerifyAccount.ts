import { useCallback } from 'react';
import { sendVerifyAccountOtp, verifyAccount } from '../api/verifyAccountApi';
import type { VerifyAccountDto } from '@/entities/user';

/**
 * Verify the account with the OTP the backend sent to the e-mail.
 */
export function useVerifyAccount() {
  return useCallback(
    (email: string, otp: string): Promise<VerifyAccountDto> => verifyAccount(email, otp),
    [],
  );
}

/** Send the verification OTP again (the "Gửi lại mã OTP" button). */
export function useSendVerifyOtp() {
  return useCallback((email: string) => sendVerifyAccountOtp(email), []);
}
