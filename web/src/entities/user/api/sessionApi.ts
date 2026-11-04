import { apiClient, GATEWAY, unwrap } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import { toNationalPhone } from '@/shared/utils';
import { clearTokens, getAccessToken, storeTokens } from '@/shared/api/tokenVault';
import { userStore } from '../model/userStore';
import type { User, UserRole } from '../model/types';

/**
 * Wire shape of `com.moonkage.identity.account.dto.AccountResponse`.
 */
export interface AccountDto {
  accountId: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  role: string;
}

export { clearTokens, getAccessToken, storeTokens };

/** Map the backend role to the UI role; unknown roles become `BUYER`. */
export function mapRole(role: string | undefined): UserRole {
  if (!role) return 'BUYER';
  const ROLE_MAP: Record<string, UserRole> = {
    BUYER: 'BUYER',
    VENDOR: 'VENDOR',
    ADMIN: 'ADMIN',
    GUEST: 'GUEST',
  };
  return ROLE_MAP[role.toUpperCase()] ?? 'BUYER';
}

export function mapAccountToUser(dto: AccountDto): User {
  return {
    id: dto.accountId,
    name: dto.fullName || dto.email || 'Người dùng Moonkage',
    email: dto.email,
    phone: toNationalPhone(dto.phoneNumber),
    role: mapRole(dto.role),
    nfcStatus: 'UNVERIFIED',
  };
}

/**
 * The read side of the session.
 *
 * The writes (`login`, `registerAccount`, `verifyAccount`, `resetPassword`)
 * belong to the `login`, `register`, `verify-account` and `reset-password`
 * features (package-architecture §3 — `api/` of a feature holds the writes).
 */
export const sessionApi = {
  /** The signed-in account profile. */
  async getMyAccount(): Promise<User> {
    if (isDemoMode()) {
      return userStore.get();
    }
    const res = await apiClient.get<unknown>(GATEWAY.IDENTITY.ME);
    const dto = unwrap<AccountDto>(res);
    if (!dto) {
      throw new Error('Máy chủ không trả về thông tin tài khoản.');
    }
    return mapAccountToUser(dto);
  },

  /** Sign out: drop the tokens and the cached profile. */
  async logout(): Promise<void> {
    clearTokens();
    if (!isDemoMode()) {
      return;
    }
  },
};
