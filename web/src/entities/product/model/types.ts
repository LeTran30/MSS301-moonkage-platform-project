// FR-54, BR-34: Danh mục vỏ và nhân bánh do quản trị quản lý
export type CakeCrust = 'nuong' | 'deo' | 'lanh' | 'khac';
export type CakeFilling =
  | 'thap-cam'
  | 'dau-xanh'
  | 'hat-sen'
  | 'dau-do'
  | 'khoai-mon'
  | 'tra-xanh'
  | 'sau-rieng'
  | 'trung-muoi'
  | 'khac';

export type CakeTaxonomyItem = {
  code: string;
  name: string;
  type: 'crust' | 'filling';
  order: number;
  isActive: boolean;
};

export const INITIAL_CRUSTS: CakeTaxonomyItem[] = [
  { code: 'nuong', name: 'Bánh nướng', type: 'crust', order: 1, isActive: true },
  { code: 'deo', name: 'Bánh dẻo', type: 'crust', order: 2, isActive: true },
  { code: 'lanh', name: 'Bánh lạnh', type: 'crust', order: 3, isActive: true },
  { code: 'khac', name: 'Vỏ khác', type: 'crust', order: 4, isActive: true },
];

export const INITIAL_FILLINGS: CakeTaxonomyItem[] = [
  { code: 'thap-cam', name: 'Thập cẩm', type: 'filling', order: 1, isActive: true },
  { code: 'dau-xanh', name: 'Đậu xanh', type: 'filling', order: 2, isActive: true },
  { code: 'hat-sen', name: 'Hạt sen', type: 'filling', order: 3, isActive: true },
  { code: 'dau-do', name: 'Đậu đỏ', type: 'filling', order: 4, isActive: true },
  { code: 'khoai-mon', name: 'Khoai môn', type: 'filling', order: 5, isActive: true },
  { code: 'tra-xanh', name: 'Trà xanh', type: 'filling', order: 6, isActive: true },
  { code: 'sau-rieng', name: 'Sầu riêng', type: 'filling', order: 7, isActive: true },
  { code: 'trung-muoi', name: 'Trứng muối', type: 'filling', order: 8, isActive: true },
  { code: 'khac', name: 'Nhân khác', type: 'filling', order: 9, isActive: true },
];

export type ProductStatus = 'ACTIVE' | 'HIDDEN' | 'REMOVED'; // BR-24, không có xóa, chỉ ẩn hoặc bị gỡ

export type Product = {
  id: string;
  name: string;
  vendorId: string;
  vendorName: string;
  brand: string; // BR-12, AC-29.4
  price: number; // Đã gồm VAT (VND)
  stock: number;
  images: string[];
  description: string;
  expiryDate: string; // DD/MM/YYYY
  deliveryTag: 'Giao nội thành' | 'Giao toàn quốc'; // BR-13
  province: string;
  rating: number;
  reviewCount: number;
  crusts: CakeCrust[];
  fillings: CakeFilling[];
  status: ProductStatus;
  soldCount: number;
  minBulkQuantity?: number;
  bulkQuoteThreshold?: number; // Ngưỡng chuyển sang báo giá (AC-08.2)
  /**
   * Hiệu có nhận đơn đặt hàng riêng (đơn theo yêu cầu) hay không (BE-04).
   *
   * Trước đây UI tự suy ra từ `bulkQuoteThreshold` — nhưng ngưỡng báo giá là "từ bao nhiêu hộp
   * thì cần báo giá", không phải "hiệu có nhận đơn riêng hay không", nên câu trả lời luôn sai.
   */
  acceptsCustomOrder?: boolean;
  isResell?: boolean;
  manufactureLocation?: string;
  removalReason?: string;
};
