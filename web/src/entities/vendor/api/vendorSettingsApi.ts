import { apiClient, type ApiResponse } from '@/shared/api/client';
import { interprovinceFeesApi, vendorsApi } from '@/shared/api/gateway';
import { mockResponse, seedStore } from '@/shared/api/mock';
import { config } from '@/shared/config/env';
import { provinceNameOf } from '@/shared/config/provinces';
import type { DeliveryZones } from '../model/deliveryZones';
import type { CustomTerms } from '../model/types';
import { getCakeAttributes, getMyVendorDetail, labelOfAttr } from './vendorApi';
import { interProvinceFees, seedTerms, seedZones } from './vendorSettingsSeed';


/** Where the shop delivers and what custom orders it takes (vendor-service), and the inter-province fee table (catalog-service). */
export const zoneStore = seedStore('vendor-zones', seedZones);
export const termsStore = seedStore('vendor-terms', seedTerms);

export async function fetchZones(): Promise<DeliveryZones> {
  if (config.demoMode) return mockResponse(zoneStore.get());
  const detail = await getMyVendorDetail();
  if (!detail) return seedZones;
  const areas = detail.deliveryAreas ?? [];
  return {
    homeProvince: provinceNameOf(detail.provinceCode),
    homeAll: areas.length === 0 || areas.includes(detail.provinceCode),
    homeFee: detail.localDeliveryFee ?? 25000,
    interProvince: areas.some((code) => code !== detail.provinceCode),
  };
}

interface InterprovinceFeeTableDto {
  fees: { provinceCode: string; provinceName: string; fee: number | null }[];
  complete: boolean;
}

export async function fetchInterProvinceFees(): Promise<{ province: string; fee: number }[]> {
  if (config.demoMode) return mockResponse(interProvinceFees);
  try {
    const res = await apiClient.get<ApiResponse<InterprovinceFeeTableDto>>(interprovinceFeesApi);
    const configured = (res.data.data?.fees ?? [])
      .filter((f): f is { provinceCode: string; provinceName: string; fee: number } => f.fee !== null)
      .map((f) => ({ province: provinceNameOf(f.provinceCode), fee: f.fee }));
    return configured.length > 0 ? configured : interProvinceFees;
  } catch {
    return interProvinceFees;
  }
}

interface OrderProfileDto {
  minQty: number;
  leadTimeDays: number;
  priceTiers: { fromQty: number; unitPrice: number }[];
  customTypes: ('BAG' | 'CARD' | 'STICKER' | 'TEMPLATE_BOX')[];
  earlyBirdOffer: string | null;
  weeklyCapacity: number | null;
  crustCodes: string[];
  fillingCodes: string[];
  packagingTypes: string | null;
  logoPrinting: boolean | null;
  distributedBrands: string | null;
  gatherableQty: number | null;
}

export async function fetchTerms(): Promise<CustomTerms> {
  if (config.demoMode) return mockResponse(termsStore.get());
  const detail = await getMyVendorDetail();
  if (!detail) return seedTerms;
  try {
    const [res, attrs] = await Promise.all([
      apiClient.get<ApiResponse<OrderProfileDto>>(
        `${vendorsApi}/${encodeURIComponent(detail.id)}/order-profile`,
      ),
      getCakeAttributes(),
    ]);
    const data = res.data.data;
    const custom: string[] = [];
    if (data.logoPrinting) custom.push('In / khắc logo lên hộp');
    if (data.customTypes?.includes('TEMPLATE_BOX')) custom.push('Hộp theo thiết kế riêng');
    if (data.customTypes?.includes('CARD')) custom.push('Thiệp kèm');
    return {
      minBoxes: data.minQty || 20,
      mockupHours: [24, 48, 72].includes((data.leadTimeDays || 1) * 24) ? (data.leadTimeDays || 1) * 24 : 24,
      crusts: (data.crustCodes ?? []).map((c) => labelOfAttr(attrs, 'CRUST', c)),
      fillings: (data.fillingCodes ?? []).map((f) => labelOfAttr(attrs, 'FILLING', f)),
      custom,
      tiers: (data.priceTiers ?? []).map((t, idx, arr) => ({
        from: t.fromQty,
        to: arr[idx + 1] ? arr[idx + 1].fromQty - 1 : null,
        price: t.unitPrice,
      })),
    };
  } catch {
    return seedTerms;
  }
}
