import { apiClient, GATEWAY, unwrapList } from '@/shared/api';
import { isDemoMode } from '@/shared/config';
import type { OwnerCheckDto, VendorResponseDto, VendorReviewDto } from './vendorDto';

/**
 * The read side of the vendor administration (FR-45, FR-46).
 *
 * The admin list of vendors to review is not the supplier catalogue: it answers
 * `VendorResponse` summaries, one per registered vendor.
 */
export const vendorAdminApi = {
  /**
   * The admin list of vendors to review (FR-45).
   *
   * `GET /api/vendors?status=PENDING` — `VendorResponse` summaries, one per
   * registered vendor, not the supplier list. The full profile (legal form,
   * documents, owner check) comes from `vendorCatalogApi.getVendorDetail`.
   */
  async searchVendors(options?: {
    status?: 'PENDING' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'LOCKED';
    ownerAccountId?: string;
  }): Promise<VendorResponseDto[]> {
    if (isDemoMode()) {
      return [];
    }
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.ownerAccountId) params.set('ownerAccountId', options.ownerAccountId);
    const query = params.toString();
    const res = await apiClient.get<unknown>(
      query ? `${GATEWAY.VENDOR.BASE}?${query}` : GATEWAY.VENDOR.BASE,
    );
    return unwrapList<VendorResponseDto>(res);
  },

  /** Past review decisions of one vendor, oldest first (AC-45.5). */
  async getVendorReviews(vendorId: string): Promise<VendorReviewDto[]> {
    if (isDemoMode()) {
      return [];
    }
    const res = await apiClient.get<unknown>(GATEWAY.VENDOR.REVIEWS(vendorId));
    return unwrapList<VendorReviewDto>(res);
  },

  /** How the owner matched the representative at each submission (AC-45.4). */
  async getOwnerChecks(vendorId: string): Promise<OwnerCheckDto[]> {
    if (isDemoMode()) {
      return [];
    }
    const res = await apiClient.get<unknown>(GATEWAY.VENDOR.OWNER_CHECKS(vendorId));
    return unwrapList<OwnerCheckDto>(res);
  },
};
