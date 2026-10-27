import { apiClient, type ApiResponse } from '@/shared/api/client';
import { cakeAttributesApi, vendorsApi } from '@/shared/api/gateway';

/** vendor-service reads the vendor channel shares: the logged-in account's vendor, and the crust / filling list. */
interface VendorSummaryDto {
  id: string;
  businessName: string;
  status: string;
}

export interface VendorDetailDto {
  id: string;
  ownerAccountId: string;
  businessName: string;
  entityType: 'HOUSEHOLD_BUSINESS' | 'SOLE_PROPRIETORSHIP';
  taxCode: string;
  address: string;
  provinceCode: string;
  representativeName: string;
  representativeIdMasked: string;
  supplySource: 'SELF_PRODUCED' | 'RESELL' | 'BOTH';
  sellsShop: boolean;
  acceptsOrders: boolean;
  bankAccount: { bankName: string; maskedNumber: string; holder: string };
  status: 'PENDING' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED' | 'LOCKED';
  statusReason: string | null;
  canOperate: boolean;
  localDeliveryFee: number | null;
  deliveryAreas: string[];
  registrationFeePaidAt: string | null;
  documents: { id: string; kind: string; objectKey?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CakeAttributeDto {
  id: string;
  group: 'CRUST' | 'FILLING';
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

const DEFAULT_ATTR_MAP: { group: 'CRUST' | 'FILLING'; code: string; label: string }[] = [
  { group: 'CRUST', code: 'nuong', label: 'Nướng' },
  { group: 'CRUST', code: 'deo', label: 'Dẻo' },
  { group: 'CRUST', code: 'than_tre', label: 'Than tre' },
  { group: 'FILLING', code: 'thap_cam', label: 'Thập cẩm' },
  { group: 'FILLING', code: 'hat_sen', label: 'Hạt sen' },
  { group: 'FILLING', code: 'dau_xanh', label: 'Đậu xanh' },
  { group: 'FILLING', code: 'tra_xanh', label: 'Trà xanh' },
];

export async function getCakeAttributes(): Promise<CakeAttributeDto[]> {
  try {
    const res = await apiClient.get<ApiResponse<CakeAttributeDto[]>>(cakeAttributesApi);
    if (res.data.data?.length) return res.data.data;
  } catch {
    // fallback to default attributes
  }
  return DEFAULT_ATTR_MAP.map((a, i) => ({ ...a, id: a.code, sortOrder: i, active: true }));
}

export function labelOfAttr(attrs: CakeAttributeDto[], group: 'CRUST' | 'FILLING', code: string): string {
  return attrs.find((a) => a.group === group && a.code === code)?.label ?? code;
}

export function codeOfAttr(attrs: CakeAttributeDto[], group: 'CRUST' | 'FILLING', label: string): string {
  const found = attrs.find((a) => a.group === group && a.label.toLowerCase() === label.trim().toLowerCase());
  if (found) return found.code;
  return label
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export async function getMyVendorDetail(): Promise<VendorDetailDto | null> {
  const listRes = await apiClient.get<ApiResponse<VendorSummaryDto[]>>(vendorsApi, {
    params: { ownerAccountId: 'me' },
  });
  const first = listRes.data.data?.[0];
  if (!first) return null;
  const detailRes = await apiClient.get<ApiResponse<VendorDetailDto>>(`${vendorsApi}/${encodeURIComponent(first.id)}`);
  return detailRes.data.data;
}
