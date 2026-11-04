import { createStore, useStore } from '@/shared/lib';
import { isDemoMode } from '@/shared/config';

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

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'ven_hoa',
    name: 'Xưởng Bánh Truyền Thống Cô Hoa',
    legalName: 'Hộ Kinh Doanh Bánh Trung Thu Thủ Công Cô Hoa',
    businessType: 'HKD',
    taxCode: '0318899123',
    representativeName: 'Nguyễn Thị Hoa',
    idCardNumberMasked: '0800••••3344',
    address: 'Thôn Đắc Sở, Xã Đắc Sở, Huyện Hoài Đức',
    province: 'Hà Nội',
    phone: '0908777666',
    email: 'cohoa.banhtrang@gmail.com',
    sellingMode: 'CUSTOM_ORDER', // Chỉ nhận đặt hàng (BR-21)
    sourceType: 'Tự sản xuất',
    status: 'APPROVED',
    hasOpeningFeePaid: true,
    rating: 4.9,
    reviewCount: 42,
    bannerImage: '/images/xuong.jpg',
    avatarImage: '/images/xuong.jpg',
    introduction:
      'Gia đình hơn 3 đời làm khuôn và đúc bánh thủ công truyền thống Bắc Bộ. Chuyên nhận hợp đồng quà tặng số lượng lớn cho công ty, ngân hàng, trường học.',
    deliveryProvinces: ['Hà Nội', 'Bắc Ninh', 'Hưng Yên', 'Hải Phòng'],
    bulkMinQuantity: 50,
    bulkLeadTimeDays: 7,
    bulkSamplePriceTiers: [
      { min: 50, max: 99, price: 160000 },
      { min: 100, max: 299, price: 145000 },
      { min: 300, max: 999, price: 130000 },
    ],
    supportedCustomOptions: ['In logo lên túi giấy', 'Thiệp chúc mừng riêng', 'Ép kim nhũ vàng trên nắp hộp', 'Dây ruy băng lụa'],
  },
  {
    id: 'ven_quan',
    name: 'Hiệu Bánh Gia Truyền Bảo An',
    legalName: 'Doanh Nghiệp Tư Nhân Sản Xuất Bánh Kẹo Bảo An',
    businessType: 'DNTN',
    taxCode: '0108877665',
    representativeName: 'Trần Minh Quân',
    idCardNumberMasked: '0010••••5566',
    address: '142 Phố Hàng Bông, Phường Hàng Gai, Quận Hoàn Kiếm',
    province: 'Hà Nội',
    phone: '0933445566',
    email: 'quan.bakery@hanoi.vn',
    sellingMode: 'BOTH', // Có hàng sẵn & Nhận đặt hàng (BR-21)
    sourceType: 'Tự sản xuất',
    status: 'APPROVED',
    hasOpeningFeePaid: true,
    rating: 4.9,
    reviewCount: 88,
    bannerImage: '/images/banh-nuong.jpg',
    avatarImage: '/images/banh-nuong.jpg',
    introduction:
      'Thương hiệu bánh trung thu phố cổ với bề dày lịch sử. Bánh tươi sản xuất hàng ngày, kết hợp cả bán lẻ tại cửa hàng và gia công hộp quà doanh nghiệp.',
    deliveryProvinces: ['Toàn quốc'],
    bulkMinQuantity: 20,
    bulkLeadTimeDays: 5,
    bulkSamplePriceTiers: [
      { min: 20, max: 49, price: 165000 },
      { min: 50, max: 199, price: 150000 },
      { min: 200, max: 500, price: 135000 },
    ],
    supportedCustomOptions: ['Ép kim logo', 'Sticker niêm phong thương hiệu', 'Hộp mẫu có sẵn'],
  },
  {
    id: 'ven_thao',
    name: 'Tiệm Bánh & Quà Thu Nguyệt',
    legalName: 'Hộ Kinh Doanh Quà Tặng Thu Nguyệt',
    businessType: 'HKD',
    taxCode: '0319922334',
    representativeName: 'Lê Thu Thảo',
    idCardNumberMasked: '0791••••1122',
    address: '88 Đường Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1',
    province: 'TP. Hồ Chí Minh',
    phone: '0987654321',
    email: 'thao.gifts@gmail.com',
    sellingMode: 'RETAIL_SHOP', // Chỉ bán lẻ hàng có sẵn (BR-21)
    sourceType: 'Bán lại', // Thuần bán lại (BR-12)
    status: 'APPROVED',
    hasOpeningFeePaid: true,
    rating: 4.8,
    reviewCount: 65,
    bannerImage: '/images/hop-qua.jpg',
    avatarImage: '/images/hop-qua.jpg',
    introduction:
      'Tuyển chọn các vị bánh trung thu cao cấp từ các nghệ nhân nổi tiếng khắp 3 miền, đóng gói sang trọng phù hợp biếu tặng.',
    deliveryProvinces: ['TP. Hồ Chí Minh', 'Bình Dương', 'Đồng Nai'],
  },
];

/**
 * The suppliers of the platform.
 *
 * In demo mode the store starts with the mock list; against a live backend it
 * starts empty and is filled by `useVendorCatalog` from `quotation-service`.
 */
export const vendorStore = createStore<Vendor[]>(
  isDemoMode() ? MOCK_VENDORS : [],
  isDemoMode() ? 'moonkage_vendors' : undefined
);

export function useVendors() {
  return useStore(vendorStore);
}

export function useVendor(id: string) {
  const vendors = useVendors();
  return vendors.find((v) => v.id === id);
}
