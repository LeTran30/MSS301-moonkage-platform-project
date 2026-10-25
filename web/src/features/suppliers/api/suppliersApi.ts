import { mockResponse } from '../../../shared/api/mock';

export interface Supplier {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  district: string;
  city: string;
  /** What the supplier makes to order, as the supplier wrote it. */
  makes: string;
  minBoxes: number;
  /** "Giao toàn quốc" or the province it delivers to. */
  reach: string;
  /** Also sells ready-made products in a Shop; false = "Chỉ nhận đặt hàng". */
  hasShop: boolean;
  rating: number | null;
}

/** What the supplier page (M3.3) shows on top of the card. */
export interface SupplierProfile extends Supplier {
  address: string;
  purchases: number;
  makesDetail: { label: string; value: string }[];
  terms: { label: string; value: string }[];
  /** Box options for a direct request (M3.4). */
  boxOptions: string[];
}

/** Sample suppliers from the wireframe (m1-0, m3-2); the supplier endpoints do not exist yet. */
const mockSuppliers: Supplier[] = [
  { id: 'nghe-nhan', name: 'Xưởng Bánh Nghệ Nhân', shortName: 'Nghệ Nhân', initials: 'NN', district: 'Ba Đình', city: 'Hà Nội', makes: 'In logo · hộp riêng', minBoxes: 20, reach: 'Giao toàn quốc', hasShop: true, rating: 4.9 },
  { id: 'trang-vang', name: 'Bánh Cổ Truyền Trăng Vàng', shortName: 'Trăng Vàng', initials: 'TV', district: 'Hoàn Kiếm', city: 'Hà Nội', makes: 'Hộp sơn mài · nhân theo yêu cầu', minBoxes: 10, reach: 'Giao Hà Nội', hasShop: true, rating: 4.8 },
  { id: 'minh-hoa', name: 'Xưởng Minh Hòa', shortName: 'Minh Hòa', initials: 'MH', district: 'Đống Đa', city: 'Hà Nội', makes: 'In logo · thiệp kèm', minBoxes: 50, reach: 'Giao toàn quốc', hasShop: false, rating: null },
  { id: 'moc-an', name: 'Xưởng Bánh Mộc An', shortName: 'Mộc An', initials: 'MA', district: 'Cầu Giấy', city: 'Hà Nội', makes: 'Bánh chay · hộp mây tre', minBoxes: 30, reach: 'Giao Hà Nội', hasShop: false, rating: 4.7 },
];

const profiles: Record<string, Omit<SupplierProfile, keyof Supplier>> = {
  'nghe-nhan': {
    address: '28 Phan Đình Phùng, Ba Đình, Hà Nội', purchases: 184,
    makesDetail: [
      { label: 'Kiểu hộp', value: '2, 4, 6 bánh; hộp gỗ, hộp giấy cứng' },
      { label: 'Làm riêng', value: 'Ép kim, dập nổi, khắc laser logo' },
      { label: 'Vỏ', value: 'Nướng, dẻo' },
      { label: 'Nhân', value: 'Thập cẩm, hạt sen, đậu xanh, trà xanh' },
    ],
    terms: [
      { label: 'Tối thiểu', value: '20 hộp' },
      { label: 'Công suất', value: '5.000 hộp/ngày' },
      { label: 'Maket', value: 'Gửi trong 24 giờ sau khi nhận cọc' },
      { label: 'Giao', value: 'Toàn quốc' },
    ],
    boxOptions: ['Hộp gỗ 4 bánh', 'Hộp giấy 6 bánh', 'Hộp 2 bánh'],
  },
  'trang-vang': {
    address: '15 Hàng Bông, Hoàn Kiếm, Hà Nội', purchases: 96,
    makesDetail: [
      { label: 'Kiểu hộp', value: '4 bánh; hộp sơn mài, hộp giấy' },
      { label: 'Làm riêng', value: 'Hộp sơn mài thủ công, in tên lên nắp, nhân theo yêu cầu' },
      { label: 'Vỏ', value: 'Nướng, dẻo' },
      { label: 'Nhân', value: 'Thập cẩm, đậu xanh, hạt sen' },
    ],
    terms: [
      { label: 'Tối thiểu', value: '10 hộp' },
      { label: 'Công suất', value: '800 hộp/ngày' },
      { label: 'Maket', value: 'Gửi trong 48 giờ sau khi nhận cọc' },
      { label: 'Giao', value: 'Hà Nội' },
    ],
    boxOptions: ['Hộp sơn mài 4 bánh', 'Hộp giấy 4 bánh'],
  },
  'minh-hoa': {
    address: '102 Tây Sơn, Đống Đa, Hà Nội', purchases: 37,
    makesDetail: [
      { label: 'Kiểu hộp', value: '4, 6 bánh; hộp giấy cứng' },
      { label: 'Làm riêng', value: 'In logo lên hộp, thiệp kèm theo mẫu của bạn' },
      { label: 'Vỏ', value: 'Nướng' },
      { label: 'Nhân', value: 'Thập cẩm, hạt sen' },
    ],
    terms: [
      { label: 'Tối thiểu', value: '50 hộp' },
      { label: 'Công suất', value: '2.000 hộp/ngày' },
      { label: 'Maket', value: 'Gửi trong 24 giờ sau khi nhận cọc' },
      { label: 'Giao', value: 'Toàn quốc' },
    ],
    boxOptions: ['Hộp giấy 4 bánh', 'Hộp giấy 6 bánh'],
  },
  'moc-an': {
    address: '45 Trần Thái Tông, Cầu Giấy, Hà Nội', purchases: 21,
    makesDetail: [
      { label: 'Kiểu hộp', value: '4 bánh; hộp mây tre' },
      { label: 'Làm riêng', value: 'Bánh chay, thiệp viết tay' },
      { label: 'Vỏ', value: 'Dẻo' },
      { label: 'Nhân', value: 'Đậu xanh, hạt sen' },
    ],
    terms: [
      { label: 'Tối thiểu', value: '30 hộp' },
      { label: 'Công suất', value: '400 hộp/ngày' },
      { label: 'Maket', value: 'Gửi trong 48 giờ sau khi nhận cọc' },
      { label: 'Giao', value: 'Hà Nội' },
    ],
    boxOptions: ['Hộp mây tre 4 bánh'],
  },
};

export function fetchSupplier(supplierId: string): Promise<SupplierProfile | null> {
  const base = mockSuppliers.find((s) => s.id === supplierId);
  const extra = profiles[supplierId];
  return mockResponse(base && extra ? { ...base, ...extra } : null);
}

/** Suppliers shown on the home page, in this order. */
const featuredIds = ['nghe-nhan', 'trang-vang', 'minh-hoa', 'moc-an'];

export function fetchSuppliers(): Promise<Supplier[]> {
  return mockResponse(mockSuppliers);
}

export function fetchFeaturedSuppliers(): Promise<Supplier[]> {
  return mockResponse(featuredIds.map((id) => mockSuppliers.find((s) => s.id === id)).filter((s): s is Supplier => Boolean(s)));
}
