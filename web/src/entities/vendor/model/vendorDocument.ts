/**
 * The kinds of file the owner attaches to the vendor profile (FR-26).
 */
export type VendorDocumentKind = 'BUSINESS_LICENSE' | 'FOOD_SAFETY';

/** Every kind the owner must have on file, in the order the forms show them (AC-26.1). */
export const OWNER_DOCUMENT_KINDS: readonly VendorDocumentKind[] = ['BUSINESS_LICENSE', 'FOOD_SAFETY'];

/** Nhãn tiếng Việt của từng loại tài liệu hồ sơ pháp lý. */
export const DOCUMENT_LABELS: Record<VendorDocumentKind, string> = {
  BUSINESS_LICENSE: 'Giấy phép kinh doanh',
  FOOD_SAFETY: 'Giấy chứng nhận An toàn thực phẩm (VSATTP)',
};
