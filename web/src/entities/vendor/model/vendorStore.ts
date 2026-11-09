import { createStore, useStore } from '@/shared/lib';

export type VendorType = 'HKD' | 'DNTN'; // Hộ kinh doanh hoặc Doanh nghiệp tư nhân (BR-33)
export type SellingMode = 'RETAIL_SHOP' | 'CUSTOM_ORDER' | 'BOTH'; // Có hàng sẵn · Nhận đặt hàng · Chỉ nhận đặt hàng (BR-21)
export type VendorApprovalStatus = 'PENDING' | 'NEED_INFO' | 'APPROVED' | 'LOCKED' | 'REJECTED';

export type Vendor = {
  id: string; // ven_hoa
  name: string; // Tên hiển thị công khai
  legalName: string; // Tên giấy phép
  businessType: VendorType;
  taxCode: string;
  representativeName: string;
  idCardNumberMasked: string;
  address: string;
  province: string;
  phone: string;
  email: string;
  sellingMode: SellingMode;
  sourceType: 'Tự sản xuất' | 'Bán lại' | 'Cả hai'; // FR-26
  status: VendorApprovalStatus;
  hasOpeningFeePaid: boolean; // FR-27, 200.000đ
  rating: number;
  reviewCount: number;
  bannerImage?: string;
  avatarImage?: string;
  introduction: string;
  deliveryProvinces: string[];
  // Điều kiện nhận đặt hàng (B6.3, US-35)
  bulkMinQuantity?: number;
  bulkLeadTimeDays?: number; // Thời gian chuẩn bị
  bulkSamplePriceTiers?: Array<{ min: number; max: number; price: number }>;
  supportedCustomOptions?: string[]; // Túi giấy, in thiệp, ép kim, khắc hộp gỗ
};

/**
 * The suppliers of the platform.
 *
 * The store starts empty and is filled by `useVendorCatalog` from
 * `quotation-service`.
 */
export const vendorStore = createStore<Vendor[]>([]);

export function useVendors() {
  return useStore(vendorStore);
}

export function useVendor(id: string) {
  const vendors = useVendors();
  return vendors.find((v) => v.id === id);
}
