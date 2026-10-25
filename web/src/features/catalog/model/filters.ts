import type { Crust, Filling, ProductSummary } from '../api/types';

/**
 * The filters of "Mua hàng có sẵn" (M2.0), kept in the URL so a filtered list can be linked and the quick chips of
 * the home page are plain links. Several values in one group = OR; between groups = AND. The delivery area is
 * not here: it is always on and comes from the area the visitor chose.
 */
export interface ProductFilters {
  query: string;
  crusts: Crust[];
  fillings: Filling[];
  brands: string[];
  shops: string[];
  priceMin: number | null;
  priceMax: number | null;
  sort: ProductSort;
}

export type ProductSort = 'rating' | 'price-asc' | 'price-desc';

export const crustLabels: Record<Crust, string> = { nuong: 'Nướng', deo: 'Dẻo', 'than-tre': 'Than tre' };
export const fillingLabels: Record<Filling, string> = {
  'thap-cam': 'Thập cẩm',
  'hat-sen': 'Hạt sen',
  'dau-xanh': 'Đậu xanh',
  'tra-xanh': 'Trà xanh',
};

const PARAM = {
  query: 'q',
  crusts: 'vo',
  fillings: 'nhan',
  brands: 'thuong-hieu',
  shops: 'shop',
  priceMin: 'gia-tu',
  priceMax: 'gia-den',
  sort: 'sap-xep',
} as const;

const SORTS: ProductSort[] = ['rating', 'price-asc', 'price-desc'];

function list<T extends string>(params: URLSearchParams, key: string, allowed?: readonly T[]): T[] {
  const values = (params.get(key) ?? '').split(',').map((v) => v.trim()).filter(Boolean) as T[];
  return allowed ? values.filter((v) => allowed.includes(v)) : values;
}

function amount(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function parseFilters(params: URLSearchParams): ProductFilters {
  const sort = params.get(PARAM.sort) as ProductSort | null;
  return {
    query: (params.get(PARAM.query) ?? '').trim(),
    crusts: list(params, PARAM.crusts, Object.keys(crustLabels) as Crust[]),
    fillings: list(params, PARAM.fillings, Object.keys(fillingLabels) as Filling[]),
    brands: list(params, PARAM.brands),
    shops: list(params, PARAM.shops),
    priceMin: amount(params, PARAM.priceMin),
    priceMax: amount(params, PARAM.priceMax),
    sort: sort && SORTS.includes(sort) ? sort : 'rating',
  };
}

/** Query string of `filters`, leaving out empty groups and the default sort. */
export function toSearchParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set(PARAM.query, filters.query);
  if (filters.crusts.length) params.set(PARAM.crusts, filters.crusts.join(','));
  if (filters.fillings.length) params.set(PARAM.fillings, filters.fillings.join(','));
  if (filters.brands.length) params.set(PARAM.brands, filters.brands.join(','));
  if (filters.shops.length) params.set(PARAM.shops, filters.shops.join(','));
  if (filters.priceMin !== null) params.set(PARAM.priceMin, String(filters.priceMin));
  if (filters.priceMax !== null) params.set(PARAM.priceMax, String(filters.priceMax));
  if (filters.sort !== 'rating') params.set(PARAM.sort, filters.sort);
  return params;
}

/** Search string for a link to the list with only these filters set (the quick chips of the home page). */
export function filterLink(partial: Partial<ProductFilters>): string {
  const params = toSearchParams({ ...emptyFilters, ...partial });
  const text = params.toString();
  return text ? `?${text}` : '';
}

export const emptyFilters: ProductFilters = {
  query: '',
  crusts: [],
  fillings: [],
  brands: [],
  shops: [],
  priceMin: null,
  priceMax: null,
  sort: 'rating',
};

export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    filters.crusts.length + filters.fillings.length + filters.brands.length + filters.shops.length > 0 ||
    filters.priceMin !== null ||
    filters.priceMax !== null
  );
}

function normalise(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

/** Accent-insensitive match of the search words against the product and shop names. */
export function matchesQuery(text: string, query: string): boolean {
  if (!query) return true;
  const haystack = normalise(text);
  return normalise(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

const byRating = (a: ProductSummary, b: ProductSummary) =>
  (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount;

export function applyFilters(products: ProductSummary[], filters: ProductFilters): ProductSummary[] {
  const result = products.filter(
    (p) =>
      matchesQuery(`${p.name} ${p.shopName}`, filters.query) &&
      (!filters.crusts.length || filters.crusts.includes(p.crust)) &&
      (!filters.fillings.length || p.fillings.some((f) => filters.fillings.includes(f))) &&
      (!filters.brands.length || filters.brands.includes(p.brand)) &&
      (!filters.shops.length || filters.shops.includes(p.shopName)) &&
      (filters.priceMin === null || p.price >= filters.priceMin) &&
      (filters.priceMax === null || p.price <= filters.priceMax),
  );
  if (filters.sort === 'price-asc') return result.sort((a, b) => a.price - b.price);
  if (filters.sort === 'price-desc') return result.sort((a, b) => b.price - a.price);
  return result.sort(byRating);
}
