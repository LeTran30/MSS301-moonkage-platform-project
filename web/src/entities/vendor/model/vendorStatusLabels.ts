/** The statuses of `com.moonkage.vendor.vendor.VendorStatus`. */
export type VendorStatus = 'PENDING' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'LOCKED';

/** Nhãn tiếng Việt của trạng thái hồ sơ người bán. */
export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  PENDING: 'Chờ thẩm định',
  NEEDS_INFO: 'Cần bổ sung hồ sơ',
  APPROVED: 'Đã duyệt hoạt động',
  REJECTED: 'Từ chối',
  LOCKED: 'Đã khoá',
};
