import { apiClient, GATEWAY, unwrap } from '@/shared/api';

import type { Address, AddressPayload } from '@/entities/address';
import { mapAddressDtoToEntity, type AddressDto } from '@/entities/address';

/**
 * The write side of the address book (FR-03, M6.3).
 *
 * The read lives in the `address` entity; these commands change what the
 * caller has saved, so they belong to a feature
 * (package-architecture §3 — `api/` of a feature holds the writes).
 */

/** Create an address (FR-03). */
export async function createAddress(payload: AddressPayload): Promise<Address> {
  const res = await apiClient.post<unknown>(GATEWAY.IDENTITY.ADDRESSES, payload);
  const dto = unwrap<AddressDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về địa chỉ vừa tạo.');
  }
  return mapAddressDtoToEntity(dto);
}

/**
 * Replace an address (FR-03).
 *
 * The backend replaces the whole address, `isDefault` included; omitting it
 * keeps the current flag.
 */
export async function updateAddress(addressId: string, payload: AddressPayload): Promise<Address> {
  const res = await apiClient.put<unknown>(GATEWAY.IDENTITY.ADDRESS_BY_ID(addressId), payload);
  const dto = unwrap<AddressDto>(res);
  if (!dto) {
    throw new Error('Máy chủ không trả về địa chỉ vừa sửa.');
  }
  return mapAddressDtoToEntity(dto);
}

/** Delete an address. The backend answers 204 (nothing to unwrap). */
export async function deleteAddress(addressId: string): Promise<void> {
  await apiClient.delete(GATEWAY.IDENTITY.ADDRESS_BY_ID(addressId));
}
