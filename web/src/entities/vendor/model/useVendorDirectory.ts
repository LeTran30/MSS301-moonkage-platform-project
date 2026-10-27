import { useAsync } from '@/shared/lib';
import { fetchFeaturedVendors, fetchVendorStorefront, fetchVendors, type VendorSummary, type VendorStorefront } from '../api/vendorDirectoryApi';

export type { VendorSummary, VendorStorefront };

export type VendorKind = 'all' | 'shop' | 'custom-only' | 'logo';

export function useVendors() {
  return useAsync(fetchVendors, []);
}

export function useVendorStorefront(vendorId: string) {
  return useAsync(() => fetchVendorStorefront(vendorId), [vendorId]);
}

/** Vendors that would receive an open request: own minimum met, and logo printing when asked. */
export function matchingVendors(vendors: VendorSummary[], boxes: number, wantsLogo: boolean): VendorSummary[] {
  return vendors.filter((s) => boxes >= s.minBoxes && (!wantsLogo || /in logo|khắc|ép kim/i.test(s.makes)));
}

export function useFeaturedVendors() {
  return useAsync(fetchFeaturedVendors, []);
}

function normalise(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/gi, 'd').toLowerCase();
}

/** Name search (accent-insensitive) and the kind chips of M3.2. */
export function filterVendors(vendors: VendorSummary[], query: string, kind: VendorKind): VendorSummary[] {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  return vendors.filter((s) => {
    const name = normalise(s.name);
    if (!words.every((w) => name.includes(w))) return false;
    if (kind === 'shop') return s.hasShop;
    if (kind === 'custom-only') return !s.hasShop;
    if (kind === 'logo') return normalise(s.makes).includes('in logo');
    return true;
  });
}
