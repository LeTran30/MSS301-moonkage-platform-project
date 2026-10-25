import { ApiError } from '../../../shared/api/client';
import { demoStore } from '../../../shared/api/demo';
import type { LoginResponse } from './login';

/** Seed accounts of demo mode, one per role of the wireframe's role switch. Password of every account: `demo`. */
export const DEMO_PASSWORD = 'demo';

export interface DemoAccount {
  username: string;
  fullName: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  /** Seller profile state of the account. */
  sellerStatus: 'none' | 'pending' | 'open';
  /** CCCD already verified when the demo starts. */
  nfcVerified: boolean;
  label: string;
}

export const demoAccounts: DemoAccount[] = [
  { username: 'nguoimua@moonkage.vn', fullName: 'Lâm Minh Anh', role: 'BUYER', sellerStatus: 'none', nfcVerified: false, label: 'Người mua chưa xác minh CCCD' },
  { username: 'congty@moonkage.vn', fullName: 'Nguyễn Thị Lan', role: 'BUYER', sellerStatus: 'none', nfcVerified: true, label: 'Người mua đã xác minh (khách doanh nghiệp)' },
  { username: 'chushop@moonkage.vn', fullName: 'Trần Văn Hoa', role: 'SELLER', sellerStatus: 'open', nfcVerified: true, label: 'Chủ Xưởng Bánh Nghệ Nhân, đang mở bán' },
  { username: 'chohoso@moonkage.vn', fullName: 'Phạm Thu Thảo', role: 'SELLER', sellerStatus: 'pending', nfcVerified: true, label: 'Chủ người bán, hồ sơ chờ duyệt' },
  { username: 'quantri@moonkage.vn', fullName: 'Trần Hà', role: 'ADMIN', sellerStatus: 'none', nfcVerified: true, label: 'Quản trị viên' },
];

const CURRENT_KEY = 'account';

export function demoAccount(username: string): DemoAccount | undefined {
  return demoAccounts.find((a) => a.username === username.trim().toLowerCase());
}

/** The demo account logged in now (set at login), for other demo answers that depend on who asks. */
export function currentDemoAccount(): DemoAccount | undefined {
  return demoAccount(demoStore.get<string>(CURRENT_KEY, ''));
}

export function demoLogin(username: string, password: string): Promise<LoginResponse> {
  const account = demoAccount(username);
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!account || password !== DEMO_PASSWORD) {
        reject(new ApiError(401, 'AUTH_001', 'Sai email/số điện thoại hoặc mật khẩu. Tài khoản demo dùng mật khẩu "demo".'));
        return;
      }
      demoStore.set(CURRENT_KEY, account.username);
      demoStore.set('name', account.fullName);
      // the NFC demo reads this key; seeded once so a verification made during the demo survives a new login
      const nfcKey = `nfc:${account.username}`;
      if (demoStore.get<boolean | null>(nfcKey, null) === null) demoStore.set(nfcKey, account.nfcVerified);
      resolve({
        token: `demo-${account.username}`,
        refreshToken: 'demo',
        accountId: account.username,
        email: account.username,
        fullName: account.fullName,
        role: account.role,
      });
    }, 300),
  );
}
