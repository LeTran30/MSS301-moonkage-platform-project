import { apiClient, type ApiResponse } from '@/shared/api/client';
import { vendorsApi } from '@/shared/api/gateway';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { formatDate } from '@/shared/utils/format';
import type { AdminProduct } from '../model/adminProductTypes';
import { seedAdminProducts } from './adminProductSeed';


/** Products on sale, which an admin can take down (Q3). */
export const adminProductStore = seedStore('admin-products', seedAdminProducts);

/** The fields of vendor-service's vendor list that this page reads. */
interface VendorSummaryDto {
  id: string;
  businessName: string;
}

interface AdminProductDto {
  id: string;
  vendorId: string;
  name: string;
  listPrice: number;
  status: 'ON_SALE' | 'HIDDEN' | 'REMOVED';
  removedReason: string | null;
  updatedAt: string;
}

const productVendorMap = new Map<string, string>();

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  if (config.demoMode) return mockResponse(adminProductStore.get());
  const vendorsRes = await apiClient.get<ApiResponse<VendorSummaryDto[]>>(vendorsApi);
  const vendors = vendorsRes.data.data ?? [];
  const allProducts = await Promise.all(
    vendors.map(async (v) => {
      try {
        const res = await apiClient.get<ApiResponse<AdminProductDto[]>>(
          `${vendorsApi}/${encodeURIComponent(v.id)}/products`,
        );
        return (res.data.data ?? []).map((p): AdminProduct => {
          productVendorMap.set(p.id, v.id);
          return {
            id: p.id,
            name: p.name,
            shop: v.businessName,
            price: p.listPrice,
            removed:
              p.status === 'REMOVED'
                ? { reason: p.removedReason || 'Vi phạm chính sách', at: formatDate(p.updatedAt) }
                : undefined,
          };
        });
      } catch {
        return [] as AdminProduct[];
      }
    }),
  );
  return allProducts.flat();
}

/** The vendor of a product listed by `fetchAdminProducts` (the take-down endpoint is per vendor). */
export const vendorIdOfProduct = (productId: string) => productVendorMap.get(productId);
