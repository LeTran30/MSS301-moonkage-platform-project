import { describe, expect, it } from 'vitest';
import type { ProductSummary } from '@/entities/product';
import { applyFilters, emptyFilters, facetsOf, filterLink, matchesQuery, parseFilters, toSearchParams } from './filters';

const product = (over: Partial<ProductSummary>): ProductSummary => ({
  id: 'p',
  name: 'Bánh',
  shopId: 's',
  shopName: 'Shop',
  district: null,
  brand: 'B',
  crustCodes: ['banh-nuong'],
  fillingCodes: ['thap-cam'],
  price: 100000,
  rating: 4.5,
  reviewCount: 1,
  deliverTo: ['Hà Nội'],
  pack: '1 bánh',
  stock: 10,
  images: [],
  ...over,
});

describe('parseFilters / toSearchParams', () => {
  it('round-trips catalogue codes', () => {
    const filters = parseFilters(new URLSearchParams('vo=banh-nuong,,banh-deo&nhan=hat-sen&gia-den=500000&sap-xep=price-asc'));
    expect(filters.crusts).toEqual(['banh-nuong', 'banh-deo']);
    expect(filters.fillings).toEqual(['hat-sen']);
    expect(filters.priceMax).toBe(500000);
    expect(filters.sort).toBe('price-asc');
    expect(toSearchParams(filters).toString()).toBe(
      'vo=banh-nuong%2Cbanh-deo&nhan=hat-sen&gia-den=500000&sap-xep=price-asc',
    );
  });

  it('falls back to the default sort and ignores bad amounts', () => {
    const filters = parseFilters(new URLSearchParams('sap-xep=x&gia-tu=-3'));
    expect(filters.sort).toBe('rating');
    expect(filters.priceMin).toBeNull();
  });

  it('builds chip links', () => {
    expect(filterLink({ crusts: ['banh-deo'] })).toBe('?vo=banh-deo');
    expect(filterLink({})).toBe('');
  });
});

describe('applyFilters', () => {
  const a = product({ id: 'a', crustCodes: ['banh-nuong'], fillingCodes: ['hat-sen'], price: 300000, rating: 4.9 });
  const b = product({ id: 'b', shopId: 's2', shopName: 'Shop 2', crustCodes: ['banh-deo'], fillingCodes: ['dau-xanh'], price: 65000, rating: 4.2 });
  const c = product({ id: 'c', crustCodes: ['banh-nuong'], fillingCodes: ['dau-xanh', 'thap-cam'], price: 900000, rating: null });

  it('ORs within a group and ANDs between groups', () => {
    const result = applyFilters([a, b, c], { ...emptyFilters, crusts: ['banh-nuong'], fillings: ['hat-sen', 'dau-xanh'] });
    expect(result.map((p) => p.id)).toEqual(['a', 'c']);
  });

  it('filters Shops by id', () => {
    expect(applyFilters([a, b, c], { ...emptyFilters, shops: ['s2'] }).map((p) => p.id)).toEqual(['b']);
  });

  it('counts facets over the text only', () => {
    const facets = facetsOf([a, b, c], '');
    expect(facets.crusts).toEqual([
      { value: 'banh-deo', count: 1 },
      { value: 'banh-nuong', count: 2 },
    ]);
    expect(facets.vendors.map((v) => [v.vendorId, v.count])).toEqual([
      ['s', 2],
      ['s2', 1],
    ]);
    expect([facets.priceMin, facets.priceMax]).toEqual([65000, 900000]);
    expect(facetsOf([a, b, c], 'khong co').priceMin).toBeNull();
  });

  it('filters by price range', () => {
    const result = applyFilters([a, b, c], { ...emptyFilters, priceMin: 100000, priceMax: 500000 });
    expect(result.map((p) => p.id)).toEqual(['a']);
  });

  it('sorts by rating with unrated last, or by price', () => {
    expect(applyFilters([c, b, a], emptyFilters).map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(applyFilters([a, b, c], { ...emptyFilters, sort: 'price-desc' }).map((p) => p.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('matchesQuery', () => {
  it('ignores accents and case', () => {
    expect(matchesQuery('Xưởng Bánh Nghệ Nhân', 'nghe nhan')).toBe(true);
    expect(matchesQuery('Bánh dẻo hạt sen', 'DEO SEN')).toBe(true);
    expect(matchesQuery('Bánh dẻo hạt sen', 'nuong')).toBe(false);
  });
});
