import type { SellingMode, VendorType } from '@/entities/vendor';

/** Nguồn gốc bánh cung cấp (BR-21, FR-26). */
export type VendorSourceType = 'Tự sản xuất' | 'Bán lại' | 'Cả hai';

/**
 * Dữ liệu form khai hồ sơ người bán (M7.1).
 *
 * Gom vào một kiểu duy nhất để các bước của wizard dùng chung, thay vì khai
 * báo từng biến ở trang.
 */
export interface VendorRegistrationForm {
  businessType: VendorType;
  shopName: string;
  legalName: string;
  taxCode: string;
  representativeName: string;
  idCardNumber: string;
  phone: string;
  address: string;
  sellingMode: SellingMode;
  sourceType: VendorSourceType;
  provinceCode: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  businessLicenseKey: string;
  foodSafetyKey: string;
}

/** Map nguồn hàng sang giá trị backend. */
export function toSupplySource(source: VendorSourceType): 'SELF_PRODUCED' | 'RESELL' | 'BOTH' {
  if (source === 'Tự sản xuất') return 'SELF_PRODUCED';
  if (source === 'Bán lại') return 'RESELL';
  return 'BOTH';
}

/** Map loại hình sang `entityType` của backend (BR-33). */
export function toEntityType(type: VendorType): 'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP' {
  return type === 'HKD' ? 'HOUSEHOLD_BUSINESS' : 'SOLE_PROPRIETORSHIP';
}
