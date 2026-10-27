import { apiClient, type ApiResponse } from '../../../shared/api/client';
import { catalogProductsApi } from '../../../shared/api/gateway';
import { mockResponse } from '../../../shared/api/mock';
import { config } from '../../../shared/config/env';
import { ALL_PROVINCE_NAMES, provinceCodeOf } from '../../../shared/config/provinces';
import { featuredProductIds, mockProducts } from './mockData';
import type { Crust, Filling, ProductDetail, ProductSummary, Review } from './types';

const HOME_COUNT = 4;

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface ProductListingDto {
  id: string;
  vendorId: string;
  vendorName: string;
  name: string;
  description: string;
  crustCodes: string[];
  fillingCodes: string[];
  brand: string;
  origin: string | null;
  piecesPerBox: number;
  listPrice: number;
  stock: number;
  inStock: boolean;
  expiryDate: string;
  deliveryLabel: string;
  quoteThreshold: number | null;
  status: string;
  imageKeys: string[];
  imageUrls: string[];
  priceTiers: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  isOwn: boolean;
  updatedAt: string;
}

interface ProductReviewDto {
  id: string;
  buyerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

const VALID_CRUSTS: Crust[] = ['nuong', 'deo', 'than-tre'];
const VALID_FILLINGS: Filling[] = ['thap-cam', 'hat-sen', 'dau-xanh', 'tra-xanh'];

function toCrust(codes: string[]): Crust {
  for (const raw of codes ?? []) {
    const normalized = raw.replace(/_/g, '-') as Crust;
    if (VALID_CRUSTS.includes(normalized)) return normalized;
  }
  return 'nuong';
}

function toFillings(codes: string[]): Filling[] {
  const result = (codes ?? [])
    .map((raw) => raw.replace(/_/g, '-') as Filling)
    .filter((f) => VALID_FILLINGS.includes(f));
  return result.length > 0 ? result : ['thap-cam'];
}

function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function initialsOf(name: string): string {
  const words = (name || 'K').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'KH';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function mapDtoToSummary(dto: ProductListingDto, area?: string): ProductSummary {
  const deliverTo = area ? [area, ...ALL_PROVINCE_NAMES.filter((p) => p !== area)] : [...ALL_PROVINCE_NAMES];
  return {
    id: dto.id,
    name: dto.name,
    shopId: dto.vendorId,
    shopName: dto.vendorName,
    brand: dto.brand || dto.vendorName,
    district: dto.origin || '',
    deliverTo,
    pack: `${dto.piecesPerBox || 4} bánh/hộp`,
    price: dto.listPrice,
    stock: dto.stock,
    rating: dto.ratingAvg !== null && dto.ratingAvg !== undefined ? Number(dto.ratingAvg) : null,
    reviewCount: dto.ratingCount ?? 0,
    crust: toCrust(dto.crustCodes),
    fillings: toFillings(dto.fillingCodes),
    images: dto.imageUrls ?? [],
  };
}

function mapDtoToDetail(dto: ProductListingDto, reviewDtos: ProductReviewDto[] = []): ProductDetail {
  const sum = mapDtoToSummary(dto);
  const specs: { label: string; value: string }[] = [
    { label: 'Quy cách', value: `${dto.piecesPerBox || 4} bánh/hộp` },
    { label: 'Thương hiệu', value: dto.brand || dto.vendorName },
    ...(dto.origin ? [{ label: 'Xuất xứ', value: dto.origin }] : []),
    ...(dto.expiryDate ? [{ label: 'Hạn sử dụng', value: formatIsoDate(dto.expiryDate) }] : []),
    ...(dto.description ? [{ label: 'Mô tả', value: dto.description }] : []),
  ];
  const reviews: Review[] = reviewDtos.map((r) => ({
    initial: initialsOf(r.buyerName),
    name: r.buyerName,
    stars: r.rating,
    date: formatIsoDate(r.createdAt),
    text: r.comment || '',
  }));
  return {
    ...sum,
    shippingFrom: 25000,
    specs,
    shopTakesCustom: dto.quoteThreshold !== null && dto.quoteThreshold !== undefined ? true : true,
    reviews,
  };
}

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

/** Resolves to null when there is no such product. */
export async function fetchProduct(productId: string): Promise<ProductDetail | null> {
  if (config.demoMode) {
    return mockResponse(mockProducts.find((p) => p.id === productId) ?? null);
  }
  try {
    const [prodRes, revRes] = await Promise.all([
      apiClient.get<ApiResponse<ProductListingDto>>(`${catalogProductsApi}/${encodeURIComponent(productId)}`),
      apiClient
        .get<ApiResponse<PageResponse<ProductReviewDto>>>(
          `${catalogProductsApi}/${encodeURIComponent(productId)}/reviews?size=20`,
        )
        .catch(() => null),
    ]);
    const dto = prodRes.data.data;
    if (!dto) return null;
    return mapDtoToDetail(dto, revRes?.data?.data?.content ?? []);
  } catch {
    return mockProducts.find((p) => p.id === productId) ?? null;
  }
}

/** Details of several products (cart, checkout); unknown ids are left out. */
export async function fetchProductsByIds(ids: string[]): Promise<ProductDetail[]> {
  if (config.demoMode) {
    return mockResponse(mockProducts.filter((p) => ids.includes(p.id)));
  }
  const results = await Promise.all(ids.map((id) => fetchProduct(id)));
  return results.filter((p): p is ProductDetail => p !== null);
}

/** Every product of one shop delivered to `area` (supplier page). */
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
