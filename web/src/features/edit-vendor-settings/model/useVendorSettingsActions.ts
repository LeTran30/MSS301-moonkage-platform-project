import { useCallback } from 'react';
import {
  resubmitVendorProfile,
  saveDeliveryAreas,
  saveOrderProfile,
  updateVendor,
} from '../api/vendorSettingsApi';
import type {
  SaveOrderProfilePayload,
  SubmitVendorPayload,
  UpdateVendorPayload,
  VendorDetailDto,
} from '@/entities/vendor';

/**
 * The seller saves the zones it delivers to (AC-29.2, BR-13).
 */
export function useSaveDeliveryAreas() {
  return useCallback(
    (vendorId: string, provinceCodes: string[]) => saveDeliveryAreas(vendorId, provinceCodes),
    [],
  );
}

/** The seller updates the profile the admin asked for (AC-27.2). */
export function useResubmitVendorProfile() {
  return useCallback(
    (vendorId: string, payload: SubmitVendorPayload) =>
      resubmitVendorProfile(vendorId, payload),
    [],
  );
}

/** The seller updates the general profile of the shop. */
export function useUpdateVendor() {
  return useCallback(
    (vendorId: string, payload: UpdateVendorPayload): Promise<VendorDetailDto | null> =>
      updateVendor(vendorId, payload),
    [],
  );
}

/** The seller saves the terms it accepts custom orders on (FR-35). */
export function useSaveOrderProfile() {
  return useCallback(
    (vendorId: string, payload: SaveOrderProfilePayload) =>
      saveOrderProfile(vendorId, payload),
    [],
  );
}
