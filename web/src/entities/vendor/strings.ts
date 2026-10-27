/** Sentences about vendors who take custom orders (Vietnamese; "bạn" for the user, no exclamation marks). */
import type { VendorSummary } from './api/vendorDirectoryApi';

export const vendorDirectoryStrings = {
  /** VendorTile line: how it sells, then the real minimum. */
  tileMeta: (s: VendorSummary) => `${s.hasShop ? 'Shop' : 'Chỉ nhận đặt hàng'} · ${s.district} · từ ${s.minBoxes} hộp`,
  homeSection: 'Nhận đặt theo yêu cầu',
  seeAll: 'Xem tất cả đơn vị cung cấp',
  customOnly: 'Chỉ nhận đặt hàng',
  hasShop: 'Có Shop',
  minBoxes: (n: number) => `Nhận từ ${n} hộp`,
  request: (shortName: string) => `Gửi yêu cầu cho ${shortName}`,
  view: 'Xem đơn vị',
  listTitle: 'Đơn vị cung cấp',
  listLead: 'Các đơn vị nhận đặt theo yêu cầu trên Moonkage.',
  searchLabel: 'Tìm theo tên đơn vị',
  searchPlaceholder: 'Tìm theo tên đơn vị…',
  kinds: { all: 'Tất cả', shop: 'Có Shop', 'custom-only': 'Chỉ nhận đặt hàng', logo: 'In logo' },
  count: (n: number) => `${n} đơn vị`,
  empty: 'Không có đơn vị khớp tìm kiếm.',
  matchTitle: (q: string) => `Đơn vị cung cấp khớp "${q}"`,
  matchNote: 'Nhận đặt theo yêu cầu · không lọc theo vùng giao',
};

/** The "sell on Moonkage" entry, by vendor status (plan section 5). */
export const vendorEntryStrings = {
  entry: { none: 'Bán hàng trên Moonkage', pending: 'Kênh người bán ›', open: 'Cửa hàng của bạn ›' },
};
