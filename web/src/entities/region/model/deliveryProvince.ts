import { createStore, useStore } from '@/shared/lib';
import { DEFAULT_PROVINCE_CODE, provinceCodeOf, provinceNameOf } from '@/shared/config/provinces';

/**
 * The province the buyer is shopping for.
 *
 * The backend filters the catalog, the cart and the supplier list by
 * `provinceCode`, so the UI needs one place that holds the current delivery
 * province. It is persisted so a reload keeps the same region.
 */
const STORAGE_KEY = 'moonkage_delivery_province';

function readInitialProvince(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_PROVINCE_CODE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? raw : DEFAULT_PROVINCE_CODE;
  } catch {
    return DEFAULT_PROVINCE_CODE;
  }
}

const provinceStore = createStore<string>(readInitialProvince(), STORAGE_KEY);

/** The numeric code the backend expects (`01` for Hà Nội). */
export function useDeliveryProvinceCode(): string {
  return useStore(provinceStore);
}

/** The display name of the current delivery province. */
export function useDeliveryProvinceName(): string {
  const code = useStore(provinceStore);
  return provinceNameOf(code) || 'Hà Nội';
}

/** Change the delivery province by its name (`Hà Nội`) or its code (`01`). */
export function setDeliveryProvince(province: string): void {
  const code = /^\d{2}$/.test(province) ? province : provinceCodeOf(province);
  provinceStore.set(code);
}
