import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { vendorAdminApi } from '../api/vendorAdminApi';
import { vendorCatalogApi } from '../api/vendorCatalogApi';
import type { VendorDetailDto } from '../api/vendorDto';
import { registrationFeeApi, type RegistrationFeeConfig } from '../api/registrationFeeApi';

/**
 * The vendor id of the signed-in seller.
 *
 * The backend answers `null` when the account has no shop yet, so the screens
 * show the "become a seller" path instead of an error.
 */
export function useMyVendorId() {
  return useQueryData(queryKeys.vendor.myId(), () => vendorCatalogApi.getMyVendorId());
}

/**
 * The signed-in seller's shop id: the one the session already knows, else the
 * one the backend answers; empty while unknown or when the account has no shop.
 */
export function useOwnVendorId(sessionVendorId: string | undefined): string {
  const myVendorId = useMyVendorId();
  if (sessionVendorId) return sessionVendorId;
  return myVendorId.kind === 'loaded' ? (myVendorId.data ?? '') : '';
}

/**
 * The shop of the signed-in seller, with the documents the admin asked for.
 *
 * `vendorId` is the id the backend needs, so the caller resolves it first.
 */
export function useMyVendorDetail(vendorId: string | null) {
  return useQueryData(queryKeys.vendor.detail(vendorId), () =>
    vendorId ? vendorCatalogApi.getVendorDetail(vendorId) : Promise.resolve(null),
  );
}

/** One shop as the public sees it. */
export function useVendorDetail(vendorId: string | null) {
  return useQueryData(queryKeys.vendor.detail(vendorId), () =>
    vendorId ? vendorCatalogApi.getVendorDetail(vendorId) : Promise.resolve(null),
  );
}

/**
 * The sellers the admin reviews.
 *
 * `status` narrows the list down (`PENDING`, `APPROVED`, ...).
 */
export function useVendorSearch(options?: {
  status?: 'PENDING' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  ownerAccountId?: string;
}) {
  const status = options?.status;
  const ownerAccountId = options?.ownerAccountId;
  return useQueryData(queryKeys.vendor.search(status, ownerAccountId), () =>
    vendorAdminApi.searchVendors({ status, ownerAccountId }),
  );
}

/** The order profile of a shop: the terms it accepts custom orders on. */
export function useOrderProfile(vendorId: string) {
  return useQueryData(queryKeys.vendor.orderProfile(vendorId), () =>
    vendorCatalogApi.getOrderProfile(vendorId),
  );
}

/**
 * The provinces the shop delivers to (FR-28, AC-28.1).
 *
 * The province is the unit of the delivery area (Q-12); the list comes from
 * the backend in code order.
 */
export function useDeliveryAreas(vendorId: string | null) {
  return useQueryData(queryKeys.vendor.deliveryAreas(vendorId ?? ''), () =>
    vendorId ? vendorCatalogApi.getDeliveryAreas(vendorId) : Promise.resolve([]),
  );
}

/** The registration fee the platform charges a new shop. */
export function useRegistrationFeeConfig() {
  return useQueryData(queryKeys.vendor.registrationFee(), () => registrationFeeApi.getConfig());
}

export type { VendorDetailDto, RegistrationFeeConfig };
