import { createStore, useStore } from '@/shared/lib';

import { type CakeTaxonomyItem, type Product } from './types';

/**
 * The catalogue of the Shop.
 *
 * The store starts empty and is filled by `useProductCatalog` from
 * `catalog-service`, so the screens never show a product the backend does not
 * know.
 */
export const productStore = createStore<Product[]>([]);

export const taxonomyStore = createStore<{
  crusts: CakeTaxonomyItem[];
  fillings: CakeTaxonomyItem[];
}>({
  crusts: [],
  fillings: [],
});

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
