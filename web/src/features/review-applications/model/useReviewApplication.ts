import { useCallback } from 'react';
import { createVendorReview } from '../api/reviewApplicationApi';
import { vendorCatalogApi, type CreateVendorReviewPayload, type VendorDetailDto } from '@/entities/vendor';

/**
 * The admin reviews an application of a shop (FR-45).
 */
export function useReviewApplication() {
  return useCallback(
    (vendorId: string, payload: CreateVendorReviewPayload) =>
      createVendorReview(vendorId, payload),
    [],
  );
}

/**
 * Load the full legal profile of a shop.
 *
 * The admin list answers summaries only; the checklist (entity type, masked
 * identity, documents) comes from `GET /api/vendors/{vendorId}`.
 */
export function useLoadVendorDetail() {
  return useCallback(
    (vendorId: string): Promise<VendorDetailDto | null> => vendorCatalogApi.getVendorDetail(vendorId),
    [],
  );
}
