import { describe, expect, it } from 'vitest';
import type { Supplier } from '../api/suppliersApi';
import { filterSuppliers } from './useSuppliers';

const s = (over: Partial<Supplier>): Supplier => ({
  id: 'x', name: 'Xưởng', shortName: 'X', initials: 'X', district: 'Ba Đình', city: 'Hà Nội',
  makes: 'Hộp riêng', minBoxes: 10, reach: 'Giao Hà Nội', hasShop: true, rating: null, ...over,
});

describe('filterSuppliers', () => {
  const list = [
    s({ id: 'a', name: 'Xưởng Bánh Nghệ Nhân', makes: 'In logo · hộp riêng' }),
    s({ id: 'b', name: 'Xưởng Minh Hòa', hasShop: false }),
  ];

  it('matches names without accents', () => {
    expect(filterSuppliers(list, 'nghe nhan', 'all').map((x) => x.id)).toEqual(['a']);
  });

  it('filters by kind', () => {
    expect(filterSuppliers(list, '', 'custom-only').map((x) => x.id)).toEqual(['b']);
    expect(filterSuppliers(list, '', 'shop').map((x) => x.id)).toEqual(['a']);
    expect(filterSuppliers(list, '', 'logo').map((x) => x.id)).toEqual(['a']);
  });
});
