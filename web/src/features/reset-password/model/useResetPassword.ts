import { useCallback } from 'react';
import { resetPassword, sendResetPasswordOtp } from '../api/resetPasswordApi';

/**
 * Ask for the reset-password OTP (AC-01.6 — it goes to the e-mail).
 */
export function useSendResetOtp() {
  return useCallback((email: string) => sendResetPasswordOtp(email), []);
}

/** Set the new password with the OTP the backend sent. */
export function useResetPassword() {
  return useCallback(
    (email: string, otp: string, newPassword: string) =>
      resetPassword(email, otp, newPassword),
    [],
  );
}
