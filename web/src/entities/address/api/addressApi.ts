import { apiClient, type ApiResponse } from '@/shared/api/client';
import { identityApi } from '@/shared/api/gateway';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceCodeOf, provinceNameOf, provinceOfficialNameOf } from '@/shared/config/provinces';

export const addressesPath = `${identityApi}/addresses`;

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  province: string;
  provinceCode?: string;
  ward?: string;
  line: string;
  isDefault: boolean;
}

export interface AddressResponseDto {
  id: string;
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  provinceName: string;
  wardName: string;
  detail: string;
  fullAddress: string;
  areaCode: string;
  label: string | null;
  isDefault: boolean;
}

interface SaveAddressRequestDto {
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  provinceName: string;
  wardName: string;
  detail: string;
  label: string;
  isDefault: boolean;
}

function normalizeDisplayPhone(raw: string): string {
  const trimmed = raw.trim();
  if (/^[35789]\d{8}$/.test(trimmed)) return `0${trimmed}`;
  return trimmed;
}

function splitLineAndWard(line: string, explicitWard?: string, fallbackWard = 'Phường trung tâm'): { detail: string; wardName: string } {
  const trimmed = line.trim();
  if (explicitWard?.trim()) {
    return { detail: trimmed, wardName: explicitWard.trim() };
  }
  const lastComma = trimmed.lastIndexOf(',');
  if (lastComma > 0 && lastComma < trimmed.length - 1) {
    const detail = trimmed.slice(0, lastComma).trim();
    const wardName = trimmed.slice(lastComma + 1).trim();
    if (detail && wardName) return { detail, wardName };
  }
  return { detail: trimmed, wardName: fallbackWard };
}

export function fromAddressDto(dto: AddressResponseDto): Address {
  const province = provinceNameOf(dto.provinceCode || dto.provinceName);
  const detail = dto.detail?.trim() ?? '';
  const ward = dto.wardName?.trim() ?? '';
  const line =
    ward && ward !== province && ward !== dto.provinceName && !detail.toLowerCase().includes(ward.toLowerCase())
      ? `${detail}, ${ward}`
      : detail;
  return {
    id: dto.id,
    label: dto.label?.trim() || 'Địa chỉ',
    name: dto.recipientName,
    phone: normalizeDisplayPhone(dto.recipientPhone),
    province,
    provinceCode: dto.provinceCode,
    ward,
    line,
    isDefault: Boolean(dto.isDefault),
  };
}

export function toSaveAddressDto(input: Omit<Address, 'id'>): SaveAddressRequestDto {
  const provinceCode = input.provinceCode || provinceCodeOf(input.province);
  const provinceName = provinceOfficialNameOf(provinceCode);
  const { detail, wardName } = splitLineAndWard(input.line, input.ward, provinceNameOf(provinceCode));
  return {
    recipientName: input.name.trim(),
    recipientPhone: input.phone.replace(/\s+/g, ''),
    provinceCode,
    provinceName,
    wardName,
    detail,
    label: input.label.trim() || 'Địa chỉ',
    isDefault: input.isDefault,
  };
}

/** Seed from the wireframe (m6-3) for demo mode. */
const seed: Address[] = [
  { id: 'a1', label: 'Nhà', name: 'Anh Minh', phone: '0912 345 678', province: 'Hà Nội', provinceCode: '01', line: '18 Hoàng Diệu, Ba Đình', isDefault: true },
  { id: 'a2', label: 'Văn phòng', name: 'Anh Minh', phone: '0912 345 678', province: 'Hà Nội', provinceCode: '01', line: 'Tòa Landmark, Cầu Giấy', isDefault: false },
  { id: 'a3', label: 'Chi nhánh HCM', name: 'Chị Lan', phone: '0988 223 344', province: 'TP Hồ Chí Minh', provinceCode: '79', line: '124 Nguyễn Huệ, Quận 1', isDefault: false },
];

export const addressStore = seedStore<Address[]>('addresses', seed);

export async function fetchAddresses(): Promise<Address[]> {
  if (config.demoMode) return mockResponse(addressStore.get());
  const response = await apiClient.get<ApiResponse<AddressResponseDto[]>>(addressesPath);
  return response.data.data.map(fromAddressDto);
}

export async function fetchAddress(id: string): Promise<Address | null> {
  if (!id) return null;
  if (config.demoMode) return mockResponse(addressStore.get().find((a) => a.id === id) ?? null);
  const list = await fetchAddresses();
  return list.find((a) => a.id === id) ?? null;
}

export const formatAddress = (a: Address) => `${a.line}, ${a.province}`;
