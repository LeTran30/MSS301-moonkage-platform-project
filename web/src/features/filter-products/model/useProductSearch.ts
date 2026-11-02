import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductSummary } from '@/entities/product';
import { loadErrorMessage, useAsync } from '@/shared/lib';
import { fetchProductFacets, searchProducts } from '../api/productSearchApi';
import { parseFilters, toSearchParams, type ProductFilters } from './filters';

/** Products per request; "Xem thêm" asks for the next page. */
export const SEARCH_PAGE_SIZE = 24;

type Results =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; items: ProductSummary[]; total: number; loadingMore: boolean };

/**
 * M2.0: the URL's filters, the matching products of `area` page by page (searched by catalog-service), and the
 * facets the filter panel offers. Changing a filter starts again from the first page.
 */
export function useProductSearch(area: string) {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const filtersKey = toSearchParams(filters).toString();
  const facets = useAsync(() => fetchProductFacets(area, filters.query), [area, filters.query]);
  const [results, setResults] = useState<Results>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setResults({ kind: 'loading' });
    searchProducts(area, filters, 0, SEARCH_PAGE_SIZE).then(
      (page) => current && setResults({ kind: 'loaded', items: page.items, total: page.total, loadingMore: false }),
      (error: unknown) => current && setResults({ kind: 'error', message: loadErrorMessage(error) }),
    );
    return () => {
      current = false;
    };
    // filtersKey stands for filters: the same filters give the same key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, filtersKey, attempt]);

  const loadMore = () => {
    if (results.kind !== 'loaded' || results.loadingMore || results.items.length >= results.total) return;
    const nextPage = Math.floor(results.items.length / SEARCH_PAGE_SIZE);
    setResults({ ...results, loadingMore: true });
    searchProducts(area, filters, nextPage, SEARCH_PAGE_SIZE).then(
      (page) =>
        setResults((now) =>
          now.kind === 'loaded'
            ? { kind: 'loaded', items: [...now.items, ...page.items], total: page.total, loadingMore: false }
            : now,
        ),
      () => setResults((now) => (now.kind === 'loaded' ? { ...now, loadingMore: false } : now)),
    );
  };

  const setFilters = (next: ProductFilters) => setParams(toSearchParams(next), { replace: true });
  const reload = () => setAttempt((n) => n + 1);

  return { filters, setFilters, results, facets, loadMore, reload };
}
