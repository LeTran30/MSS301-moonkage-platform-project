import { useAsync } from '../../../shared/ui';
import { fetchFeaturedSuppliers, fetchSupplier, fetchSuppliers, type Supplier } from '../api/suppliersApi';

export type SupplierKind = 'all' | 'shop' | 'custom-only' | 'logo';

export function useSuppliers() {
  return useAsync(fetchSuppliers, []);
}

export function useSupplier(supplierId: string) {
  return useAsync(() => fetchSupplier(supplierId), [supplierId]);
}

/** Suppliers that would receive an open request: own minimum met, and logo printing when asked. */
export function matchingSuppliers(suppliers: Supplier[], boxes: number, wantsLogo: boolean): Supplier[] {
  return suppliers.filter((s) => boxes >= s.minBoxes && (!wantsLogo || /in logo|khắc|ép kim/i.test(s.makes)));
}

export function useFeaturedSuppliers() {
  return useAsync(fetchFeaturedSuppliers, []);
}

function normalise(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/gi, 'd').toLowerCase();
}

/** Name search (accent-insensitive) and the kind chips of M3.2. */
export function filterSuppliers(suppliers: Supplier[], query: string, kind: SupplierKind): Supplier[] {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  return suppliers.filter((s) => {
    const name = normalise(s.name);
    if (!words.every((w) => name.includes(w))) return false;
    if (kind === 'shop') return s.hasShop;
    if (kind === 'custom-only') return !s.hasShop;
    if (kind === 'logo') return normalise(s.makes).includes('in logo');
    return true;
  });
}
