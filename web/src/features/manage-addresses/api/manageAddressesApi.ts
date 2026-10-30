import {
  addressesPath,
  addressStore,
  fetchAddress,
  fromAddressDto,
  toSaveAddressDto,
  type Address,
  type AddressResponseDto,
} from '@/entities/address';
import { apiClient, type ApiResponse } from '@/shared/api/client';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceCodeOf } from '@/shared/config/provinces';

export async function saveAddress(input: Omit<Address, 'id'> & { id?: string }): Promise<Address> {
  if (config.demoMode) {
    const id = input.id ?? `a${Date.now()}`;
    const saved = { ...input, provinceCode: provinceCodeOf(input.province), id };
    addressStore.update((list) => {
      const next = input.id ? list.map((a) => (a.id === id ? saved : a)) : [...list, saved];
      return saved.isDefault ? next.map((a) => ({ ...a, isDefault: a.id === id })) : next;
    });
    return mockResponse(saved);
  }
  const payload = toSaveAddressDto(input);
  if (input.id) {
    const response = await apiClient.put<ApiResponse<AddressResponseDto>>(
      `${addressesPath}/${encodeURIComponent(input.id)}`,
      payload,
    );
    return fromAddressDto(response.data.data);
  }
  const response = await apiClient.post<ApiResponse<AddressResponseDto>>(addressesPath, payload);
  return fromAddressDto(response.data.data);
}

export async function setDefaultAddress(id: string): Promise<boolean> {
  if (config.demoMode) {
    addressStore.update((list) => list.map((a) => ({ ...a, isDefault: a.id === id })));
    return mockResponse(true);
  }
  const target = await fetchAddress(id);
  if (!target) return false;
  await saveAddress({ ...target, isDefault: true });
  return true;
}

export async function deleteAddress(id: string): Promise<boolean> {
  if (config.demoMode) {
    addressStore.update((list) => list.filter((a) => a.id !== id));
    return mockResponse(true);
  }
  await apiClient.delete(`${addressesPath}/${encodeURIComponent(id)}`);
  return true;
}
