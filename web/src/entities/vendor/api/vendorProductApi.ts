import { apiClient, type ApiResponse } from '@/shared/api/client';
import { vendorsApi } from '@/shared/api/gateway';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { formatDate } from '@/shared/utils/format';
import type { VendorProduct } from '../model/vendorProductTypes';
import { getCakeAttributes, getMyVendorDetail, labelOfAttr, type CakeAttributeDto } from './vendorApi';
import { seedProducts } from './vendorProductSeed';


/** The shop's products on vendor-service (`/api/vendors/{id}/products`). */
export const vendorProductStore = seedStore('vendor-products', seedProducts);

export interface ProductResponseDto {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  brand: string;
  origin: string | null;
  resold: boolean;
  piecesPerBox: number;
  listPrice: number;
  stock: number;
  expiryDate: string;
  deliveryLabel: string;
  quoteThreshold: number | null;
  priceTiers: { fromQty: number; unitPrice: number }[];
  images: { key: string; url: string }[];
  crustCodes: string[];
  fillingCodes: string[];
  status: 'ON_SALE' | 'HIDDEN' | 'REMOVED';
  removedReason: string | null;
  version: number;
  updatedAt: string;
}

function mapVendorProduct(dto: ProductResponseDto, attrs: CakeAttributeDto[]): VendorProduct {
  return {
    id: dto.id,
    name: dto.name,
    crusts: dto.crustCodes.map((c) => labelOfAttr(attrs, 'CRUST', c)),
    fillings: dto.fillingCodes.map((f) => labelOfAttr(attrs, 'FILLING', f)),
    price: dto.listPrice,
    stock: dto.stock,
    visible: dto.status === 'ON_SALE',
    removed:
      dto.status === 'REMOVED'
        ? { at: formatDate(dto.updatedAt), reason: dto.removedReason || 'Vi phạm chính sách' }
        : undefined,
  };
}

export async function fetchVendorProducts(): Promise<VendorProduct[]> {
  if (config.demoMode) return mockResponse(vendorProductStore.get());
  const detail = await getMyVendorDetail();
  if (!detail) return [];
  const [res, attrs] = await Promise.all([
    apiClient.get<ApiResponse<ProductResponseDto[]>>(`${vendorsApi}/${encodeURIComponent(detail.id)}/products`),
    getCakeAttributes(),
  ]);
  return (res.data.data ?? []).map((p) => mapVendorProduct(p, attrs));
}

export async function fetchVendorProduct(id: string): Promise<VendorProduct | null> {
  if (!id) return null;
  if (config.demoMode) return mockResponse(vendorProductStore.get().find((p) => p.id === id) ?? null);
  const detail = await getMyVendorDetail();
  if (!detail) return null;
  const [res, attrs] = await Promise.all([
    apiClient.get<ApiResponse<ProductResponseDto>>(
      `${vendorsApi}/${encodeURIComponent(detail.id)}/products/${encodeURIComponent(id)}`,
    ),
    getCakeAttributes(),
  ]);
  return res.data.data ? mapVendorProduct(res.data.data, attrs) : null;
}
