import { apiClient, GATEWAY, unwrapList } from '@/shared/api';

import type { Address } from '../model/types';

/**
 * Wire shape of `com.moonkage.identity.address.dto.AddAddressResponse`.
 *
 * The backend sends `fullAddress` (ready to show) and `areaCode` (the key to
 * filter products and sellers by delivery area, AC-03.2); both are kept so the
 * UI never has to rebuild the line itself.
 */
export interface AddressDto {
  id: string;
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  provinceName: string;
  wardName: string;
  detail: string;
  fullAddress: string;
  areaCode?: string;
  label?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Map the backend address to the UI entity. */
export function mapAddressDtoToEntity(dto: AddressDto): Address {
  return {
    id: dto.id,
    recipientName: dto.recipientName,
    recipientPhone: dto.recipientPhone,
    provinceCode: dto.provinceCode,
    provinceName: dto.provinceName,
    wardName: dto.wardName,
    detail: dto.detail,
    fullAddress: dto.fullAddress,
    areaCode: dto.areaCode,
    label: dto.label,
    isDefault: Boolean(dto.isDefault),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

/**
 * The read side of the address book (FR-03).
 *
 * The writes (`createAddress`, `updateAddress`, `deleteAddress`) belong to the
 * `edit-address` feature (package-architecture §3 — `api/` of a feature holds
 * the writes).
 */
export const addressApi = {
  /** The addresses of the caller. */
  async list(): Promise<Address[]> {
    const res = await apiClient.get<unknown>(GATEWAY.IDENTITY.ADDRESSES);
    return unwrapList<AddressDto>(res).map(mapAddressDtoToEntity);
  },
};
