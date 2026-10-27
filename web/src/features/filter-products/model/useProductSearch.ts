import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAreaProducts } from '@/entities/product';
import { applyFilters, parseFilters, toSearchParams, type ProductFilters } from './filters';

/** Products of `area` with the URL's filters applied, the filters themselves, and a setter that writes the URL. */
export function useProductSearch(area: string) {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const all = useAreaProducts(area);

  const setFilters = (next: ProductFilters) => setParams(toSearchParams(next), { replace: true });
  const results = all.kind === 'loaded' ? applyFilters(all.data, filters) : [];

  return { all, filters, setFilters, results };
}
