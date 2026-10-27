import { apiClient, type ApiResponse } from '@/shared/api/client';
import { catalogProductsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceCodeOf } from '@/shared/config/provinces';
import type { ProductDetail, ProductSummary } from '../model/types';
import { featuredProductIds, mockProducts } from './mockData';
import { mapDtoToSummary, type PageResponse, type ProductListingDto } from './productApi';

const HOME_COUNT = 4;

function summary({ shippingFrom: _f, specs: _p, shopTakesCustom: _c, reviews: _r, ...rest }: ProductDetail): ProductSummary {
  return rest;
}

/** Every product delivered to `area`; filtering and sorting happen in `model/filters.ts`. */
export async function fetchProducts(area: string): Promise<ProductSummary[]> {
  if (config.demoMode) {
    return mockResponse(mockProducts.filter((p) => p.deliverTo.includes(area)).map(summary));
  }
  const provinceCode = provinceCodeOf(area);
  const res = await apiClient.get<ApiResponse<PageResponse<ProductListingDto>>>(
    `${catalogProductsApi}?provinceCode=${encodeURIComponent(provinceCode)}&size=100`,
  );
  return (res.data.data?.content ?? []).map((dto) => mapDtoToSummary(dto, area));
}

/**
 * Up to four products for the home page: the featured ones delivered to `area`, topped up with the area's
 * best-rated products when the featured ones do not reach it.
 */
export async function fetchFeaturedProducts(area: string): Promise<ProductSummary[]> {
  if (config.demoMode) {
    const inArea = mockProducts.filter((p) => p.deliverTo.includes(area));
    const featured = featuredProductIds.map((id) => inArea.find((p) => p.id === id)).filter((p): p is ProductDetail => Boolean(p));
    const rest = inArea
      .filter((p) => !featured.includes(p))
      .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    return mockResponse([...featured, ...rest].slice(0, HOME_COUNT).map(summary));
  }
  const all = await fetchProducts(area);
  return [...all].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1)).slice(0, HOME_COUNT);
}

/** Every product of one shop delivered to `area` (vendor page). */
export async function fetchShopProducts(shopId: string): Promise<ProductSummary[]> {
  if (config.demoMode) {
    return mockResponse(mockProducts.filter((p) => p.shopId === shopId).map(summary));
  }
  try {
    const res = await apiClient.get<ApiResponse<PageResponse<ProductListingDto>>>(
      `${catalogProductsApi}?provinceCode=01&vendorId=${encodeURIComponent(shopId)}&size=50`,
    );
    return (res.data.data?.content ?? []).map((dto) => mapDtoToSummary(dto));
  } catch {
    return [];
  }
}
