import type { SellingMode, VendorDocumentKind, VendorType } from '@/entities/vendor';

/** Nguồn gốc bánh cung cấp (BR-21, FR-26). */
export type VendorSourceType = 'Tự sản xuất' | 'Bán lại' | 'Cả hai';

/** Một giấy tờ đã tải lên kho, chờ nộp cùng hồ sơ (FR-26). */
export interface UploadedVendorDocument {
  /** `tempKey` từ `POST /api/vendors/uploads`. */
  tempKey: string;
  /** Tên tệp người bán đã chọn, để hiện lại khi quay về bước 3 hoặc xem lại. */
  fileName: string;
}

/**
 * Dữ liệu form khai hồ sơ người bán (M7.1).
 *
 * Gom vào một kiểu duy nhất để các bước của wizard dùng chung, thay vì khai
 * báo từng biến ở trang.
 */
export interface VendorRegistrationForm {
  businessType: VendorType;
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
  documents: Partial<Record<VendorDocumentKind, UploadedVendorDocument>>;
}

/** Map nguồn hàng sang giá trị backend. */
export function toSupplySource(source: VendorSourceType): 'SELF_PRODUCED' | 'RESELL' | 'BOTH' {
  if (source === 'Tự sản xuất') return 'SELF_PRODUCED';
  if (source === 'Bán lại') return 'RESELL';
  return 'BOTH';
}

/** Nhãn tiếng Việt của cách bán, cho bước 3 và bước xem lại. */
export const SELLING_MODE_LABELS: Record<SellingMode, string> = {
  BOTH: 'Có hàng sẵn bán lẻ & Nhận đơn đặt sỉ',
  CUSTOM_ORDER: 'Chỉ nhận đơn đặt hàng số lượng lớn (Xưởng)',
  RETAIL_SHOP: 'Chỉ bán lẻ sản phẩm có sẵn tại Shop',
};

/** Map loại hình sang `entityType` của backend (BR-33). */
export function toEntityType(type: VendorType): 'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP' {
  return type === 'HKD' ? 'HOUSEHOLD_BUSINESS' : 'SOLE_PROPRIETORSHIP';
}
