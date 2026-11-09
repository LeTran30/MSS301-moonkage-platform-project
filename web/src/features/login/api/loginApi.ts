import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';
import { mapAccountToUser, mapRole, storeTokens, type User } from '@/entities/user';
/**
 * The write side of signing in (FR-01).
 *
 * The user entity owns the read (`getMyAccount`) and the shape of the user;
 * the write lives here because it starts the session, not the user data
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/**
 * Sign in.
 *
 * The backend answers `LoginResponse` with the access token, the refresh token and the
 * account profile. The tokens are kept in `localStorage` because the Axios
 * interceptor reads them from there.
 */
export async function login(username: string, password: string): Promise<User> {
  const res = await apiClient.post<unknown>(GATEWAY.IDENTITY.LOGIN, {
    username,
    password,
  });
  const dto = unwrap<{
    token: string;
    refreshToken: string;
    accountId: string;
    email: string;
    phoneNumber: string;
    fullName: string;
    role: string;
  }>(res);
  if (!dto || !dto.token) {
    throw new Error('Máy chủ không trả về phiên đăng nhập.');
  }

  storeTokens(dto.token, dto.refreshToken);

  // Funnel đăng nhập (FR-01). Chỉ ghi vai trò — không ghi tên, email hay
  // số điện thoại (NFR-03).
  trackEvent(ANALYTICS_EVENTS.login, { role: mapRole(dto.role) });

  return mapAccountToUser(dto);
}
