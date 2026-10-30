import { authApi, DEMO_ACCOUNT_KEY, DEMO_PASSWORD, demoAccount, nfcDemoAccountKey, type LoginResponse } from '@/entities/user';
import { apiClient, ApiError, type ApiResponse } from '@/shared/api/client';
import { demoStore } from '@/shared/api/demo';
import { config } from '@/shared/config/env';

const DEMO_DELAY_MS = 300;

function demoLogin(username: string, password: string): Promise<LoginResponse> {
  const account = demoAccount(username);
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!account || password !== DEMO_PASSWORD) {
        reject(new ApiError(401, 'AUTH_001', 'Sai email/số điện thoại hoặc mật khẩu. Tài khoản demo dùng mật khẩu "demo".'));
        return;
      }
      demoStore.set(DEMO_ACCOUNT_KEY, account.username);
      demoStore.set('name', account.fullName);
      // the NFC demo reads this key; seeded once so a verification made during the demo survives a new login
      const nfcKey = nfcDemoAccountKey();
      if (demoStore.get<boolean | null>(nfcKey, null) === null) demoStore.set(nfcKey, account.nfcVerified);
      resolve({
        token: `demo-${account.username}`,
        refreshToken: 'demo',
        accountId: account.username,
        email: account.username,
        fullName: account.fullName,
        role: account.role,
      });
    }, DEMO_DELAY_MS),
  );
}

/** `username` is the e-mail or the phone number (FR-02). */
export async function login(username: string, password: string): Promise<LoginResponse> {
  if (config.demoMode) return demoLogin(username, password);
  const response = await apiClient.post<ApiResponse<LoginResponse>>(`${authApi}/login`, { username, password });
  return response.data.data;
}
