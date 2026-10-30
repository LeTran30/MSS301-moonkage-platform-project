import { provinceFeeStore, taxonomyStore, vendorFeeStore, type CakeAttributeDto, type ProvinceFee, type Taxonomy } from '@/entities/platform-config';
import { apiClient, type ApiResponse } from '@/shared/api/client';
import { cakeAttributesApi, interprovinceFeesApi, registrationFeeConfigApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceCodeOf } from '@/shared/config/provinces';

export async function saveProvinceFees(next: ProvinceFee[]): Promise<boolean> {
  if (config.demoMode) {
    provinceFeeStore.update(() => next);
    return mockResponse(true);
  }
  const payload = {
    fees: next
      .filter((f): f is { province: string; fee: number } => f.fee !== null)
      .map((f) => ({ provinceCode: provinceCodeOf(f.province), fee: f.fee })),
  };
  await apiClient.put(interprovinceFeesApi, payload);
  return true;
}

export async function saveVendorFee(amount: number): Promise<boolean> {
  if (config.demoMode) {
    vendorFeeStore.update(() => amount);
    return mockResponse(true);
  }
  await apiClient.put(registrationFeeConfigApi, { amount });
  return true;
}

export async function saveTaxonomy(next: Taxonomy): Promise<boolean> {
  if (config.demoMode) {
    taxonomyStore.update(() => next);
    return mockResponse(true);
  }
  const res = await apiClient.get<ApiResponse<CakeAttributeDto[]>>(cakeAttributesApi, {
    params: { includeHidden: true },
  });
  const existing = res.data.data ?? [];

  const syncGroup = async (group: 'CRUST' | 'FILLING', items: { name: string; visible: boolean }[]) => {
    for (const item of items) {
      const found = existing.find((a) => a.group === group && a.label.toLowerCase() === item.name.trim().toLowerCase());
      if (found) {
        if (found.active !== item.visible) {
          await apiClient.patch(`${cakeAttributesApi}/${encodeURIComponent(found.id)}`, {
            active: item.visible,
          });
        }
      } else {
        const createdRes = await apiClient.post<ApiResponse<CakeAttributeDto>>(cakeAttributesApi, {
          group,
          label: item.name.trim(),
        });
        if (!item.visible && createdRes.data.data?.id) {
          await apiClient.patch(`${cakeAttributesApi}/${encodeURIComponent(createdRes.data.data.id)}`, {
            active: false,
          });
        }
      }
    }
  };

  await syncGroup('CRUST', next.crusts);
  await syncGroup('FILLING', next.fillings);
  return true;
}
