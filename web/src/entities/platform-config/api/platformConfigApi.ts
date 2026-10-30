import { apiClient, type ApiResponse } from '@/shared/api/client';
import { cakeAttributesApi, interprovinceFeesApi, registrationFeeConfigApi } from '@/shared/api/gateway';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { PROVINCE_ITEMS, provinceNameOf } from '@/shared/config/provinces';
import type { ProvinceFee, Taxonomy } from '../model/types';
import { seedProvinceFees, seedTaxonomy } from './seed';

/** Platform settings: inter-province fees (catalog-service), the vendor fee and the crust / filling list (vendor-service) (Q6). */
export const provinceFeeStore = seedStore('admin-province-fees', seedProvinceFees);
export const vendorFeeStore = seedStore('admin-vendor-fee', 200000);
export const taxonomyStore = seedStore('admin-taxonomy', seedTaxonomy);

interface InterprovinceFeeTableDto {
  fees: { provinceCode: string; provinceName: string; fee: number | null }[];
  complete: boolean;
}

export async function fetchProvinceFees(): Promise<ProvinceFee[]> {
  if (config.demoMode) return mockResponse(provinceFeeStore.get());
  const res = await apiClient.get<ApiResponse<InterprovinceFeeTableDto>>(interprovinceFeesApi);
  const rows = res.data.data?.fees ?? [];
  if (rows.length > 0) {
    return rows.map((f) => ({ province: provinceNameOf(f.provinceCode), fee: f.fee }));
  }
  return PROVINCE_ITEMS.map((p) => ({ province: p.name, fee: null }));
}

interface RegistrationFeeConfigDto {
  amount: number;
  effectiveFrom: string;
}

export async function fetchVendorFee(): Promise<number> {
  if (config.demoMode) return mockResponse(vendorFeeStore.get());
  const res = await apiClient.get<ApiResponse<RegistrationFeeConfigDto>>(registrationFeeConfigApi);
  return res.data.data?.amount ?? 200000;
}

export interface CakeAttributeDto {
  id: string;
  group: 'CRUST' | 'FILLING';
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

export async function fetchTaxonomy(): Promise<Taxonomy> {
  if (config.demoMode) return mockResponse(taxonomyStore.get());
  const res = await apiClient.get<ApiResponse<CakeAttributeDto[]>>(cakeAttributesApi, {
    params: { includeHidden: true },
  });
  const list = res.data.data ?? [];
  return {
    crusts: list.filter((a) => a.group === 'CRUST').map((a) => ({ name: a.label, visible: a.active })),
    fillings: list.filter((a) => a.group === 'FILLING').map((a) => ({ name: a.label, visible: a.active })),
  };
}
