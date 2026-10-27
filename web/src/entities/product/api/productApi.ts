import { apiClient, type ApiResponse } from '@/shared/api/client';
import { catalogProductsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { ALL_PROVINCE_NAMES } from '@/shared/config/provinces';
import type { Crust, Filling, ProductDetail, ProductSummary, Review } from '../model/types';
import { mockProducts } from './mockData';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ProductListingDto {
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

export interface ProductReviewDto {
  id: string;
  buyerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

function toCrust(codes: string[]): Crust {
  if (codes.includes('DEO')) return 'deo';
  if (codes.includes('THAN_TRE')) return 'than-tre';
  return 'nuong';
}

const FILLING_CODE_MAP: Record<string, Filling> = {
  THAP_CAM: 'thap-cam',
  HAT_SEN: 'hat-sen',
  DAU_XANH: 'dau-xanh',
  TRA_XANH: 'tra-xanh',
  KHOAI_MON: 'khoai-mon',
  ME_DEN: 'me-den',
  YEN_SAO: 'yen-sao',
  VI_CA: 'vi-ca',
};

function toFillings(codes: string[]): Filling[] {
  const result = codes.map((c) => FILLING_CODE_MAP[c]).filter((f): f is Filling => Boolean(f));
  return result.length > 0 ? result : ['thap-cam'];
}

function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

function initialsOf(name: string): string {
  const words = (name || 'K').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'KH';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function mapDtoToSummary(dto: ProductListingDto, area?: string): ProductSummary {
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

export function mapDtoToDetail(dto: ProductListingDto, reviewDtos: ProductReviewDto[] = []): ProductDetail {
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
