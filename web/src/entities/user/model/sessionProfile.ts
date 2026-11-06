import { nfcApi, type NfcStatusDto } from '../api/nfcApi';
import { getMyVendorId } from '@/entities/vendor/@x/user';
import type { User } from './types';

const NFC_STATUS: Record<NfcStatusDto['nfcStatus'], User['nfcStatus']> = {
  NOT_VERIFIED: 'UNVERIFIED',
  VERIFIED: 'VERIFIED',
  LOCKED: 'LOCKED',
};

/**
 * Bổ sung những phần hồ sơ mà câu trả lời đăng nhập không mang.
 *
 * Hồ sơ đầy đủ của người dùng nằm ở hai nơi khác nhau: Shop của người bán
 * (FR-27) và trạng thái định danh NFC (FR-04). Đọc riêng từng nơi bằng
 * `Promise.allSettled` giúp một lần đọc lỗi **không làm hỏng cả phiên**:
 * tài khoản vẫn dùng được khi một trong hai nguồn không trả lời.
 */
export async function enrichSessionProfile(user: User): Promise<User> {
  const [vendorId, nfc] = await Promise.allSettled([getMyVendorId(), nfcApi.getMyStatus()]);

  return {
    ...user,
    ...(vendorId.status === 'fulfilled' && vendorId.value ? { vendorId: vendorId.value, hasShop: true } : {}),
    ...(nfc.status === 'fulfilled' ? { nfcStatus: NFC_STATUS[nfc.value.nfcStatus] ?? user.nfcStatus } : {}),
  };
}
