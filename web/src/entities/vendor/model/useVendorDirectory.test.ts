import { describe, expect, it } from 'vitest';
import type { VendorSummary } from '../api/vendorDirectoryApi';
import { filterVendors } from './useVendorDirectory';

const s = (over: Partial<VendorSummary>): VendorSummary => ({
  id: 'x', name: 'Xưởng', shortName: 'X', initials: 'X', district: 'Ba Đình', city: 'Hà Nội',
  makes: 'Hộp riêng', minBoxes: 10, reach: 'Giao Hà Nội', hasShop: true, rating: null, ...over,
});

describe('filterVendors', () => {
  const list = [
    s({ id: 'a', name: 'Xưởng Bánh Nghệ Nhân', makes: 'In logo · hộp riêng' }),
    s({ id: 'b', name: 'Xưởng Minh Hòa', hasShop: false }),
  ];

  it('matches names without accents', () => {
    expect(filterVendors(list, 'nghe nhan', 'all').map((x) => x.id)).toEqual(['a']);
  });

  it('filters by kind', () => {
    expect(filterVendors(list, '', 'custom-only').map((x) => x.id)).toEqual(['b']);
    expect(filterVendors(list, '', 'shop').map((x) => x.id)).toEqual(['a']);
    expect(filterVendors(list, '', 'logo').map((x) => x.id)).toEqual(['a']);
  });
});
