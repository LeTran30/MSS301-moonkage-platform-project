import { createStore, useStore } from '@/shared/lib';
import type { CakeTaxonomyItem, Product } from './types';

/**
 * The catalogue the buyer sees, filled by `useProductCatalog` from
 * `catalog-service`, so the screens never show a product the backend does not know.
 */
export const productStore = createStore<Product[]>([]);

export const taxonomyStore = createStore<{ crusts: CakeTaxonomyItem[]; fillings: CakeTaxonomyItem[] }>(
  // Filled by `useTaxonomyCatalog` from the cake attributes of the backend (FR-54).
  { crusts: [], fillings: [] },
);

export function useProducts(): Product[] {
  return useStore(productStore);
}

export function useProduct(id: string): Product | undefined {
  const products = useProducts();
  return products.find((p) => p.id === id);
}

export function useTaxonomy() {
  return useStore(taxonomyStore);
}
