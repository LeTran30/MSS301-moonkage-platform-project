import {
  fetchProducts,
  mapDtoToSummary,
  type PageResponse,
  type ProductListingDto,
  type ProductSummary,
} from '@/entities/product';
import { apiClient, type ApiResponse } from '@/shared/api/client';
import { catalogProductsApi } from '@/shared/api/gateway';
import { config } from '@/shared/config/env';
import { provinceCodeOf } from '@/shared/config/provinces';
import { applyFilters, facetsOf, type ProductFacets, type ProductFilters } from '../model/filters';

/** One page of results and how many products match in all. */
export interface ProductSearchPage {
  items: ProductSummary[];
  total: number;
}

/** Query string of GET /api/products for `filters`; a list goes comma separated, empty values are left out. */
function searchParams(area: string, filters: ProductFilters, page: number, size: number): URLSearchParams {
  const params = new URLSearchParams({ provinceCode: provinceCodeOf(area), page: String(page), size: String(size) });
  if (filters.query) params.set('q', filters.query);
  if (filters.shops.length) params.set('vendorId', filters.shops.join(','));
  if (filters.brands.length) params.set('brand', filters.brands.join(','));
  if (filters.crusts.length) params.set('crust', filters.crusts.join(','));
  if (filters.fillings.length) params.set('filling', filters.fillings.join(','));
  if (filters.priceMin !== null) params.set('priceMin', String(filters.priceMin));
  if (filters.priceMax !== null) params.set('priceMax', String(filters.priceMax));
  params.set('sort', filters.sort);
  return params;
}

/** M2.0: products delivered to `area` matching `filters`, filtered and sorted by catalog-service. */
export async function searchProducts(
  area: string,
  filters: ProductFilters,
  page: number,
  size: number,
): Promise<ProductSearchPage> {
  if (config.demoMode) {
    const all = applyFilters(await fetchProducts(area), filters);
    return { items: all.slice(page * size, (page + 1) * size), total: all.length };
  }
  const res = await apiClient.get<ApiResponse<PageResponse<ProductListingDto>>>(
    `${catalogProductsApi}?${searchParams(area, filters, page, size).toString()}`,
  );
  const data = res.data.data;
  return { items: (data?.content ?? []).map((dto) => mapDtoToSummary(dto, area)), total: data?.totalElements ?? 0 };
}

/** What the filters can offer in `area` for the text `query`. */
export async function fetchProductFacets(area: string, query: string): Promise<ProductFacets> {
  if (config.demoMode) return facetsOf(await fetchProducts(area), query);
  const params = new URLSearchParams({ provinceCode: provinceCodeOf(area) });
  if (query) params.set('q', query);
  const res = await apiClient.get<ApiResponse<ProductFacets>>(`${catalogProductsApi}/facets?${params.toString()}`);
  return (
    res.data.data ?? { crusts: [], fillings: [], brands: [], vendors: [], priceMin: null, priceMax: null }
  );
}
