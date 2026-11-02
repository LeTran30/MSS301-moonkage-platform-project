import { formatVnd } from '@/shared/utils/money';
import { labelOf, type CakeAttributeLabels } from '@/entities/product';
import { emptyFilters, hasActiveFilters, type ProductFacets, type ProductFilters, type ProductSort } from '../model/filters';
import { filterStrings } from '../strings';
import styles from './ProductToolbar.module.css';

/** Active filters as removable chips, "Xóa lọc", and the sort. */
export function ProductToolbar({
  filters,
  facets,
  labels,
  onChange,
}: {
  filters: ProductFilters;
  facets: ProductFacets | undefined;
  labels: CakeAttributeLabels | undefined;
  onChange: (next: ProductFilters) => void;
}) {
  const shopName = (id: string) => facets?.vendors.find((v) => v.vendorId === id)?.vendorName ?? id;
  const active: { label: string; remove: () => void }[] = [
    ...filters.brands.map((b) => ({ label: b, remove: () => onChange({ ...filters, brands: filters.brands.filter((x) => x !== b) }) })),
    ...filters.crusts.map((c) => ({ label: labelOf(labels?.crusts, c), remove: () => onChange({ ...filters, crusts: filters.crusts.filter((x) => x !== c) }) })),
    ...filters.fillings.map((f) => ({ label: `${filterStrings.fillingChip} ${labelOf(labels?.fillings, f).toLowerCase()}`, remove: () => onChange({ ...filters, fillings: filters.fillings.filter((x) => x !== f) }) })),
    ...filters.shops.map((s) => ({ label: shopName(s), remove: () => onChange({ ...filters, shops: filters.shops.filter((x) => x !== s) }) })),
    ...(filters.priceMin !== null ? [{ label: `Từ ${formatVnd(filters.priceMin)}`, remove: () => onChange({ ...filters, priceMin: null }) }] : []),
    ...(filters.priceMax !== null ? [{ label: `Đến ${formatVnd(filters.priceMax)}`, remove: () => onChange({ ...filters, priceMax: null }) }] : []),
  ];

  return (
    <div className={`${styles.toolbar} product-toolbar`}>
      <div className={`${styles.chips} product-toolbar__chips`}>
        {active.map((chip) => (
          <button key={chip.label} type="button" className="mk-chip" aria-pressed="true" onClick={chip.remove} aria-label={filterStrings.removeFilter(chip.label)}>
            {chip.label} ✕
          </button>
        ))}
        {hasActiveFilters(filters) && (
          <button type="button" className="mk-btn mk-btn--text mk-btn--sm" onClick={() => onChange({ ...emptyFilters, query: filters.query, sort: filters.sort })}>
            {filterStrings.clearFilters}
          </button>
        )}
      </div>
      <div className={`${styles.sort} product-toolbar__sort`}>
        <label htmlFor="sort" className="muted">
          {filterStrings.sort}
        </label>
        <select id="sort" className="select" value={filters.sort} onChange={(e) => onChange({ ...filters, sort: e.target.value as ProductSort })}>
          {(Object.keys(filterStrings.sorts) as ProductSort[]).map((s) => (
            <option key={s} value={s}>
              {filterStrings.sorts[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
