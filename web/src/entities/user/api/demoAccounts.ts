import { demoStore } from '@/shared/api/demo';

/** Seed accounts of demo mode, one per role of the wireframe's role switch. Password of every account: `demo`. */
export const DEMO_PASSWORD = 'demo';

export interface DemoAccount {
  username: string;
  fullName: string;
  role: 'BUYER' | 'VENDOR' | 'ADMIN';
  /** Vendor profile state of the account. */
  vendorStatus: 'none' | 'pending' | 'open';
  /** CCCD already verified when the demo starts. */
  nfcVerified: boolean;
  label: string;
}

export const demoAccounts: DemoAccount[] = [
  { username: 'nguoimua@moonkage.vn', fullName: 'Lâm Minh Anh', role: 'BUYER', vendorStatus: 'none', nfcVerified: false, label: 'Người mua chưa xác minh CCCD' },
  { username: 'congty@moonkage.vn', fullName: 'Nguyễn Thị Lan', role: 'BUYER', vendorStatus: 'none', nfcVerified: true, label: 'Người mua đã xác minh (khách doanh nghiệp)' },
  { username: 'chushop@moonkage.vn', fullName: 'Trần Văn Hoa', role: 'VENDOR', vendorStatus: 'open', nfcVerified: true, label: 'Chủ Xưởng Bánh Nghệ Nhân, đang mở bán' },
  { username: 'chohoso@moonkage.vn', fullName: 'Phạm Thu Thảo', role: 'VENDOR', vendorStatus: 'pending', nfcVerified: true, label: 'Chủ người bán, hồ sơ chờ duyệt' },
  { username: 'quantri@moonkage.vn', fullName: 'Trần Hà', role: 'ADMIN', vendorStatus: 'none', nfcVerified: true, label: 'Quản trị viên' },
];

/** Demo store key of the logged-in demo account. */
export const DEMO_ACCOUNT_KEY = 'account';

export function demoAccount(username: string): DemoAccount | undefined {
  return demoAccounts.find((a) => a.username === username.trim().toLowerCase());
}

/** The demo account logged in now (set at login), for other demo answers that depend on who asks. */
export function currentDemoAccount(): DemoAccount | undefined {
  return demoAccount(demoStore.get<string>(DEMO_ACCOUNT_KEY, ''));
}
