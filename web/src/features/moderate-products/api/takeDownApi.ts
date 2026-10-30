import { adminProductStore, fetchAdminProducts, vendorIdOfProduct } from '@/entities/product';
import { apiClient } from '@/shared/api/client';
import { vendorsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { today } from '@/shared/utils/format';

export async function takeDownProduct(id: string, reason: string): Promise<boolean> {
  if (config.demoMode) {
    adminProductStore.update((list) => list.map((p) => (p.id === id ? { ...p, removed: { reason, at: today() } } : p)));
    return mockResponse(true);
  }
  let vendorId = vendorIdOfProduct(id);
  if (!vendorId) {
    await fetchAdminProducts();
    vendorId = vendorIdOfProduct(id);
  }
  if (!vendorId) return false;
  await apiClient.patch(`${vendorsApi}/${encodeURIComponent(vendorId)}/products/${encodeURIComponent(id)}`, {
    status: 'REMOVED',
    removedReason: reason.trim(),
  });
  return true;
}

