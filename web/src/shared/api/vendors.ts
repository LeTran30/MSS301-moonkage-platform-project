import { apiClient, type ApiResponse } from './client';
import { vendorDirectoryApi, vendorsApi } from './gateway';

/**
 * Shop names by vendorId, for screens that show orders of many shops. The public directory (quotation-service)
 * answers anyone; vendor-service's list answers admins and holds every vendor. A source that refuses is skipped.
 */
export async function fetchVendorNames(): Promise<Map<string, string>> {
  const [directory, all] = await Promise.all([
    apiClient
      .get<ApiResponse<{ vendorId: string; businessName: string }[]>>(vendorDirectoryApi)
      .then((r) => (r.data.data ?? []).map((v) => [v.vendorId, v.businessName] as const))
      .catch(() => []),
    apiClient
      .get<ApiResponse<{ id: string; businessName: string }[]>>(vendorsApi)
      .then((r) => (r.data.data ?? []).map((v) => [v.id, v.businessName] as const))
      .catch(() => []),
  ]);
  return new Map([...directory, ...all]);
}

/** The caller's own Shop (vendor-service), null when the account has none. */
export async function fetchMyVendorId(): Promise<string | null> {
  const res = await apiClient.get<ApiResponse<{ id: string }[]>>(vendorsApi, { params: { ownerAccountId: 'me' } });
  return res.data.data?.[0]?.id ?? null;
}
