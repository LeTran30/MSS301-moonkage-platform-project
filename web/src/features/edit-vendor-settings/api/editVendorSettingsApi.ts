import { codeOfAttr, getCakeAttributes, getMyVendorDetail, termsStore, zoneStore, type CustomTerms, type DeliveryZones } from '@/entities/vendor';
import { apiClient } from '@/shared/api/client';
import { vendorsApi } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { PROVINCE_ITEMS, provinceCodeOf } from '@/shared/config/provinces';

export async function saveZones(next: DeliveryZones): Promise<boolean> {
  if (config.demoMode) {
    zoneStore.update(() => next);
    return mockResponse(true);
  }
  const detail = await getMyVendorDetail();
  if (!detail) return false;
  const homeCode = detail.provinceCode || provinceCodeOf(next.homeProvince);
  const provinceCodes = next.interProvince ? PROVINCE_ITEMS.map((p) => p.code) : [homeCode];
  await Promise.all([
    apiClient.put(`${vendorsApi}/${encodeURIComponent(detail.id)}/delivery-areas`, { provinceCodes }),
    apiClient.patch(`${vendorsApi}/${encodeURIComponent(detail.id)}`, { localDeliveryFee: next.homeFee }),
  ]);
  return true;
}

export async function saveTerms(next: CustomTerms): Promise<boolean> {
  if (config.demoMode) {
    termsStore.update(() => next);
    return mockResponse(true);
  }
  const detail = await getMyVendorDetail();
  if (!detail) return false;
  const attrs = await getCakeAttributes();
  const customTypes: ('BAG' | 'CARD' | 'STICKER' | 'TEMPLATE_BOX')[] = [];
  if (next.custom.some((c) => c.includes('Hộp theo thiết kế'))) customTypes.push('TEMPLATE_BOX');
  if (next.custom.some((c) => c.includes('Thiệp'))) customTypes.push('CARD');

  const produces = detail.supplySource !== 'RESELL';
  const resells = detail.supplySource !== 'SELF_PRODUCED';
  const payload = {
    minQty: next.minBoxes,
    leadTimeDays: Math.max(1, Math.round(next.mockupHours / 24)),
    priceTiers: next.tiers
      .filter((t) => t.from > 0 && t.price > 0)
      .map((t) => ({ fromQty: t.from, unitPrice: t.price })),
    customTypes,
    weeklyCapacity: produces ? Math.max(100, next.minBoxes * 5) : undefined,
    crustCodes: produces ? next.crusts.map((c) => codeOfAttr(attrs, 'CRUST', c)) : undefined,
    fillingCodes: produces ? next.fillings.map((f) => codeOfAttr(attrs, 'FILLING', f)) : undefined,
    packagingTypes: produces ? 'Hộp 2 bánh, hộp 4 bánh, hộp 6 bánh' : undefined,
    logoPrinting: produces ? next.custom.some((c) => c.toLowerCase().includes('logo')) : undefined,
    distributedBrands: resells ? detail.businessName : undefined,
    gatherableQty: resells ? Math.max(100, next.minBoxes * 5) : undefined,
  };
  await apiClient.put(`${vendorsApi}/${encodeURIComponent(detail.id)}/order-profile`, payload);
  return true;
}
