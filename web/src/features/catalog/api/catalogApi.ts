import { mockResponse } from '../../../shared/api/mock';
import { featuredProductIds, mockProducts } from './mockData';
import type { ProductDetail, ProductSummary } from './types';

/** Not on the backend yet: answers from the sample catalogue (see mockData.ts). */

const HOME_COUNT = 4;

function summary({ shippingFrom: _f, specs: _p, shopTakesCustom: _c, reviews: _r, ...rest }: ProductDetail): ProductSummary {
  return rest;
}

/** Every product delivered to `area`; filtering and sorting happen in `model/filters.ts`. */
export function fetchProducts(area: string): Promise<ProductSummary[]> {
  return mockResponse(mockProducts.filter((p) => p.deliverTo.includes(area)).map(summary));
}

/**
 * Up to four products for the home page: the featured ones delivered to `area`, topped up with the area's
 * best-rated products when the featured ones do not reach it.
 */
export function fetchFeaturedProducts(area: string): Promise<ProductSummary[]> {
  const inArea = mockProducts.filter((p) => p.deliverTo.includes(area));
  const featured = featuredProductIds.map((id) => inArea.find((p) => p.id === id)).filter((p): p is ProductDetail => Boolean(p));
  const rest = inArea
    .filter((p) => !featured.includes(p))
    .sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
  return mockResponse([...featured, ...rest].slice(0, HOME_COUNT).map(summary));
}

/** Resolves to null when there is no such product. */
export function fetchProduct(productId: string): Promise<ProductDetail | null> {
  return mockResponse(mockProducts.find((p) => p.id === productId) ?? null);
}

/** Details of several products (cart, checkout); unknown ids are left out. */
export function fetchProductsByIds(ids: string[]): Promise<ProductDetail[]> {
  return mockResponse(mockProducts.filter((p) => ids.includes(p.id)));
}

/** Every product of one shop delivered to `area` (supplier page). */
export function fetchShopProducts(shopId: string): Promise<ProductSummary[]> {
  return mockResponse(mockProducts.filter((p) => p.shopId === shopId).map(summary));
}
