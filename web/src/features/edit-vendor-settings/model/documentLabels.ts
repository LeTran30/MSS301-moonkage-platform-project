import type { VendorDocumentKind } from '@/entities/vendor';

/** Nhãn tiếng Việt của từng loại tài liệu hồ sơ pháp lý. */
export const DOCUMENT_LABELS: Record<VendorDocumentKind, string> = {
  BUSINESS_LICENSE: 'Giấy phép kinh doanh',
  FOOD_SAFETY: 'Giấy chứng nhận An toàn thực phẩm (VSATTP)',
};
