import { useCallback } from 'react';
import {
  createVendorProduct,
  replaceVendorProduct,
  updateVendorProductStatus,
} from '../api/vendorProductWriteApi';
import type {
  SaveVendorProductPayload,
  UpdateVendorProductPayload,
  VendorProductDto,
} from '@/entities/vendor';

/**
 * The seller creates or replaces a product (FR-29 to FR-33).
 *
 * `version` must be sent back when the product is replaced: the backend
 * answers 409 VENDOR_027 when someone changed it since.
 */
export function useSaveProduct() {
  return useCallback(
    (
      vendorId: string,
      productId: string | null,
      payload: SaveVendorProductPayload,
    ): Promise<VendorProductDto | null> =>
      productId
        ? replaceVendorProduct(vendorId, productId, payload)
        : createVendorProduct(vendorId, payload),
    [],
  );
}

/**
 * The owner hides a product, the admin removes it (FR-34, FR-46).
 */
export function useChangeProductStatus() {
  return useCallback(
    (
      vendorId: string,
      productId: string,
      payload: UpdateVendorProductPayload,
    ): Promise<VendorProductDto | null> =>
      updateVendorProductStatus(vendorId, productId, payload),
    [],
  );
}
