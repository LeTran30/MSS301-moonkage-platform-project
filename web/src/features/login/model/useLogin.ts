import { useCallback } from 'react';
import { demoAccount, useSession } from '@/entities/user';
import { config } from '@/shared/config/env';
import { login } from '../api/loginApi';

/** Logs in and starts the session; an admin has no vendor profile, a demo account's comes from the seed. */
export function useLogin() {
  const { startSession } = useSession();
  return useCallback(
    async (username: string, password: string) => {
      const response = await login(username, password);
      const isAdmin = response.role.toUpperCase().includes('ADMIN');
      await startSession({
        token: response.token,
        refreshToken: response.refreshToken,
        accountId: response.accountId,
        email: response.email || (username.includes('@') ? username : undefined),
        displayName: response.fullName || response.email || username,
        isAdmin,
        vendorStatus: config.demoMode ? (demoAccount(username)?.vendorStatus ?? 'none') : isAdmin ? 'none' : undefined,
      });
    },
    [startSession],
  );
}
