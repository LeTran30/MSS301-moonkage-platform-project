import { useCallback } from 'react';
import { queryClient, queryKeys } from '@/shared/api';
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

/** A write changed this product: the shop's list and the product must be read again. */
async function forgetProduct(vendorId: string, productId: string | null | undefined) {
  await queryClient.invalidateQueries({ queryKey: queryKeys.vendor.products(vendorId) });
  if (productId) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.vendor.product(vendorId, productId) });
  }
}

/**
 * The seller creates or replaces a product (FR-29 to FR-33).
 *
 * `version` must be sent back when the product is replaced: the backend
 * answers 409 VENDOR_027 when someone changed it since.
 */
export function useSaveProduct() {
  return useCallback(
    async (
      vendorId: string,
      productId: string | null,
      payload: SaveVendorProductPayload,
    ): Promise<VendorProductDto | null> => {
      const saved = productId
        ? await replaceVendorProduct(vendorId, productId, payload)
        : await createVendorProduct(vendorId, payload);
      await forgetProduct(vendorId, productId ?? saved?.id);
      return saved;
    },
    [],
  );
}

/**
 * The owner hides a product, the admin removes it (FR-34, FR-46).
 */
export function useChangeProductStatus() {
  return useCallback(
    async (
      vendorId: string,
      productId: string,
      payload: UpdateVendorProductPayload,
    ): Promise<VendorProductDto | null> => {
      const changed = await updateVendorProductStatus(vendorId, productId, payload);
      await forgetProduct(vendorId, productId);
      return changed;
    },
    [],
  );
}
