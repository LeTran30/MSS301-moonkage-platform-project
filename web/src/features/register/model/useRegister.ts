import { useCallback } from 'react';
import { registerAccount } from '../api/registerApi';
import type { RegisterDto } from '@/entities/user';

/**
 * Create an account.
 *
 * The backend answers with the created account and sends an OTP to the e-mail.
 */
export function useRegister() {
  return useCallback(
    (payload: {
      email: string;
      phoneNumber?: string;
      fullName: string;
      password: string;
    }): Promise<RegisterDto> => registerAccount(payload),
    [],
  );
}
