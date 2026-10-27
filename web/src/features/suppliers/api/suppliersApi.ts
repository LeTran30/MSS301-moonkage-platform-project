import { apiClient, type ApiResponse } from '../../../shared/api/client';
import { suppliersApi } from '../../../shared/api/gateway';
import { mockResponse } from '../../../shared/api/mock';
import { config } from '../../../shared/config/env';
import { provinceNameOf } from '../../../shared/config/provinces';

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

interface SupplierResponseDto {
  vendorId: string;
  businessName: string;
  ordersOnly: boolean;
  supplySource: string | null;
  minQty: number | null;
  leadTimeDays: number | null;
  customCapabilities: string[];
  deliveryAreas: string[];
  earlyBirdOffer: string | null;
  refPriceTiers: unknown;
  isOwn: boolean;
}

const CAPABILITY_LABELS: Record<string, string> = {
  BAG: 'Túi riêng',
  CARD: 'Thiệp kèm',
  STICKER: 'Nhãn dán riêng',
  TEMPLATE_BOX: 'In logo · hộp riêng',
};

function initialsOf(name: string): string {
  const words = (name || 'X').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'XB';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function shortNameOf(name: string): string {
  return name.replace(/^(Xưởng Bánh|Bánh Cổ Truyền|Xưởng|Tiệm Bánh|Công ty)\s+/i, '').trim() || name;
}

function mapSupplierDto(dto: SupplierResponseDto): Supplier {
  const areas = dto.deliveryAreas ?? [];
  const city = areas.length > 0 ? provinceNameOf(areas[0]) : 'Hà Nội';
  const reach = areas.length > 1 ? 'Giao toàn quốc' : `Giao ${city}`;
  const caps = (dto.customCapabilities ?? []).map((c) => CAPABILITY_LABELS[c] || c);
  const makes = caps.length > 0 ? caps.join(' · ') : 'In logo · hộp riêng';
  return {
    id: dto.vendorId,
    name: dto.businessName,
    shortName: shortNameOf(dto.businessName),
    initials: initialsOf(dto.businessName),
    district: dto.supplySource === 'RESELL' ? 'Nhà phân phối' : 'Xưởng sản xuất',
    city,
    makes,
    minBoxes: dto.minQty ?? 20,
    reach,
    hasShop: !dto.ordersOnly,
    rating: null,
  };
}

function mapSupplierProfileDto(dto: SupplierResponseDto): SupplierProfile {
  const base = mapSupplierDto(dto);
  const leadHours = (dto.leadTimeDays ?? 1) * 24;
  return {
    ...base,
    address: `${base.district}, ${base.city}`,
    purchases: 0,
    makesDetail: [
      { label: 'Kiểu hộp', value: '2, 4, 6 bánh; hộp gỗ, hộp giấy cứng' },
      { label: 'Làm riêng', value: base.makes },
      ...(dto.earlyBirdOffer ? [{ label: 'Ưu đãi đặt sớm', value: dto.earlyBirdOffer }] : []),
    ],
    terms: [
      { label: 'Tối thiểu', value: `${base.minBoxes} hộp` },
      { label: 'Maket', value: `Gửi trong ${leadHours} giờ sau khi nhận cọc` },
      { label: 'Giao', value: base.reach.replace(/^Giao\s+/i, '') },
    ],
    boxOptions: ['Hộp gỗ 4 bánh', 'Hộp giấy 6 bánh', 'Hộp 2 bánh'],
  };
}

/** Sample suppliers from the wireframe (m1-0, m3-2). */
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

export async function fetchSupplier(supplierId: string): Promise<SupplierProfile | null> {
  if (config.demoMode) {
    const base = mockSuppliers.find((s) => s.id === supplierId);
    const extra = profiles[supplierId];
    return mockResponse(base && extra ? { ...base, ...extra } : null);
  }
  try {
    const res = await apiClient.get<ApiResponse<SupplierResponseDto>>(
      `${suppliersApi}/${encodeURIComponent(supplierId)}`,
    );
    return res.data.data ? mapSupplierProfileDto(res.data.data) : null;
  } catch {
    const base = mockSuppliers.find((s) => s.id === supplierId);
    const extra = profiles[supplierId];
    return base && extra ? { ...base, ...extra } : null;
  }
}

/** Suppliers shown on the home page, in this order. */
const featuredIds = ['nghe-nhan', 'trang-vang', 'minh-hoa', 'moc-an'];

export async function fetchSuppliers(): Promise<Supplier[]> {
  if (config.demoMode) {
    return mockResponse(mockSuppliers);
  }
  try {
    const res = await apiClient.get<ApiResponse<SupplierResponseDto[]>>(suppliersApi);
    return (res.data.data ?? []).map(mapSupplierDto);
  } catch {
    return mockSuppliers;
  }
}

export async function fetchFeaturedSuppliers(): Promise<Supplier[]> {
  if (config.demoMode) {
    return mockResponse(featuredIds.map((id) => mockSuppliers.find((s) => s.id === id)).filter((s): s is Supplier => Boolean(s)));
  }
  const all = await fetchSuppliers();
  return all.slice(0, 4);
}
