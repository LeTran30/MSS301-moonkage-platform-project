import { type Product, type CakeCrust, type CakeFilling } from './types';

export type ProductSortOption = 'price_asc' | 'price_desc' | 'rating';

export interface ProductFilterCriteria {
  searchQuery?: string;
  crusts?: CakeCrust[];
  fillings?: CakeFilling[];
  brand?: string;
  sortOption?: ProductSortOption;
}

/**
 * Quy tắc cốt lõi FR-06 & AC-06.2:
 * - Nhiều giá trị trong cùng một bộ lọc là HOẶC (OR).
 * - Giữa các bộ lọc khác nhau là VÀ (AND).
 * - Tìm kiếm theo text: khớp Tên bánh HOẶC Thương hiệu HOẶC Xưởng sản xuất.
 */
export function filterProducts(
  products: Product[],
  criteria: ProductFilterCriteria = {}
): Product[] {
  const {
    searchQuery = '',
    crusts = [],
    fillings = [],
    brand = 'ALL',
    sortOption = 'rating',
  } = criteria;

  const normalizedQ = searchQuery.trim().toLowerCase();

  return products
    .filter((p) => {
      // 1. Text search
      if (normalizedQ) {
        const matchName = p.name.toLowerCase().includes(normalizedQ);
        const matchBrand = p.brand.toLowerCase().includes(normalizedQ);
        const matchVendor = p.vendorName.toLowerCase().includes(normalizedQ);
        if (!matchName && !matchBrand && !matchVendor) return false;
      }

      // 2. Vỏ bánh: Trong cùng bộ lọc là HOẶC (OR)
      if (crusts.length > 0) {
        const matchCrust = p.crusts?.some((c) => crusts.includes(c));
        if (!matchCrust) return false;
      }

      // 3. Nhân bánh: Trong cùng bộ lọc là HOẶC (OR)
      if (fillings.length > 0) {
        const matchFilling = p.fillings?.some((f) => fillings.includes(f));
        if (!matchFilling) return false;
      }

      // 4. Thương hiệu
      if (brand && brand !== 'ALL' && p.brand !== brand) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'price_asc') return a.price - b.price;
      if (sortOption === 'price_desc') return b.price - a.price;
      return b.rating - a.rating;
    });
}
