import { useCallback } from 'react';
import { createAddress, deleteAddress, updateAddress } from '../api/addressWriteApi';
import type { Address, AddressPayload } from '@/entities/address';

/**
 * The caller edits the address book (FR-03, M6.3).
 *
 * Every command returns the address the backend kept, so the screen can show
 * what really was saved instead of what it hoped for.
 */
export function useCreateAddress() {
  return useCallback((payload: AddressPayload): Promise<Address> => createAddress(payload), []);
}

/** Replace one address of the address book. */
export function useUpdateAddress() {
  return useCallback(
    (addressId: string, payload: AddressPayload): Promise<Address> =>
      updateAddress(addressId, payload),
    [],
  );
}

/** Remove one address of the address book. */
export function useDeleteAddress() {
  return useCallback((addressId: string): Promise<void> => deleteAddress(addressId), []);
}
