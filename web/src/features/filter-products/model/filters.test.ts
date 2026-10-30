import { describe, expect, it } from 'vitest';
import type { ProductSummary } from '@/entities/product';
import { applyFilters, emptyFilters, filterLink, matchesQuery, parseFilters, toSearchParams } from './filters';

const product = (over: Partial<ProductSummary>): ProductSummary => ({
  id: 'p',
  name: 'Bánh',
  shopId: 's',
  shopName: 'Shop',
  district: null,
  brand: 'B',
  crust: 'nuong',
  fillings: ['thap-cam'],
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
  it('round-trips and drops unknown values', () => {
    const filters = parseFilters(new URLSearchParams('vo=nuong,abc&nhan=hat-sen&gia-den=500000&sap-xep=price-asc'));
    expect(filters.crusts).toEqual(['nuong']);
    expect(filters.fillings).toEqual(['hat-sen']);
    expect(filters.priceMax).toBe(500000);
    expect(filters.sort).toBe('price-asc');
    expect(toSearchParams(filters).toString()).toBe('vo=nuong&nhan=hat-sen&gia-den=500000&sap-xep=price-asc');
  });

  it('falls back to the default sort and ignores bad amounts', () => {
    const filters = parseFilters(new URLSearchParams('sap-xep=x&gia-tu=-3'));
    expect(filters.sort).toBe('rating');
    expect(filters.priceMin).toBeNull();
  });

  it('builds chip links', () => {
    expect(filterLink({ crusts: ['deo'] })).toBe('?vo=deo');
    expect(filterLink({})).toBe('');
  });
});

describe('applyFilters', () => {
  const a = product({ id: 'a', crust: 'nuong', fillings: ['hat-sen'], price: 300000, rating: 4.9 });
  const b = product({ id: 'b', crust: 'deo', fillings: ['dau-xanh'], price: 65000, rating: 4.2 });
  const c = product({ id: 'c', crust: 'nuong', fillings: ['dau-xanh', 'thap-cam'], price: 900000, rating: null });

  it('ORs within a group and ANDs between groups', () => {
    const result = applyFilters([a, b, c], { ...emptyFilters, crusts: ['nuong'], fillings: ['hat-sen', 'dau-xanh'] });
    expect(result.map((p) => p.id)).toEqual(['a', 'c']);
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
