/** Sentences of the product filters (Vietnamese; "bạn" for the user, no exclamation marks). */
export const filterStrings = {
  filters: 'Bộ lọc',
  price: 'Giá',
  priceFrom: 'Từ (đ)',
  priceTo: 'Đến (đ)',
  brand: 'Thương hiệu',
  crust: 'Vỏ bánh',
  filling: 'Nhân bánh',
  shop: 'Shop',
  filterHint: 'Nhiều lựa chọn trong một nhóm = HOẶC; giữa các nhóm = VÀ.',
  clearFilters: 'Xóa lọc',
  removeFilter: (label: string) => `Bỏ lọc ${label}`,
  sort: 'Sắp xếp',
  sorts: { rating: 'Đánh giá cao', 'price-asc': 'Giá thấp → cao', 'price-desc': 'Giá cao → thấp' },

  quickTitle: 'Tìm nhanh',
  allFilters: 'Tất cả bộ lọc',
  under: (amount: string) => `Dưới ${amount}`,
};
