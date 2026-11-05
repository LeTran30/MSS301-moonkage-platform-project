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
