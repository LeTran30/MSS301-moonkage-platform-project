import { useState } from 'react';
import { labelOf, type CakeAttributeLabels } from '@/entities/product';
import type { ProductFacets, ProductFilters } from '../model/filters';
import { filterStrings } from '../strings';
import styles from './ProductFilterPanel.module.css';

type ListKey = 'crusts' | 'fillings' | 'brands' | 'shops';

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

function CheckGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  if (!options.length) return null;
  return (
    <fieldset className={`${styles.group} filter-group`}>
      <legend className={`${styles.groupLegend} filter-group__legend`}>{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="check">
          <input type="checkbox" checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}

/** Remounted (by key) when the filter changes elsewhere, e.g. a removed chip, so the text follows the URL. */
function PriceInput({ id, label, value, onCommit }: { id: string; label: string; value: number | null; onCommit: (v: number | null) => void }) {
  const [text, setText] = useState(value === null ? '' : String(value));
  const commit = () => {
    const digits = text.replace(/\D/g, '');
    onCommit(digits ? Number(digits) : null);
  };
  return (
    <div className="mk-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
    </div>
  );
}

/**
 * Left column of M2.0. Options are the facets of the area and the search text, so no option leads to an empty list
 * by itself; crusts and fillings follow the order of the vendor catalogue.
 */
export function ProductFilterPanel({
  facets,
  labels,
  filters,
  onChange,
}: {
  facets: ProductFacets;
  labels: CakeAttributeLabels | undefined;
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
}) {
  const set = (key: ListKey, value: string) =>
    onChange({ ...filters, [key]: toggle(filters[key] as string[], value) });
  const inCatalogueOrder = (counts: { value: string }[], catalogue: Record<string, string> | undefined) => {
    const order = Object.keys(catalogue ?? {});
    const rank = (code: string) => (order.includes(code) ? order.indexOf(code) : order.length);
    return [...counts]
      .sort((a, b) => rank(a.value) - rank(b.value))
      .map((c) => ({ value: c.value, label: labelOf(catalogue, c.value) }));
  };

  return (
    <aside className={`${styles.panel} filter-panel`} aria-labelledby="filter-heading">
      <h2 id="filter-heading" className={`${styles.title} filter-panel__title`}>
        {filterStrings.filters}
      </h2>
      <fieldset className={`${styles.group} filter-group`}>
        <legend className={`${styles.groupLegend} filter-group__legend`}>{filterStrings.price}</legend>
        <div className={`${styles.priceRange} filter-panel__price`}>
          <PriceInput key={`min-${filters.priceMin}`} id="price-min" label={filterStrings.priceFrom} value={filters.priceMin} onCommit={(v) => onChange({ ...filters, priceMin: v })} />
          <PriceInput key={`max-${filters.priceMax}`} id="price-max" label={filterStrings.priceTo} value={filters.priceMax} onCommit={(v) => onChange({ ...filters, priceMax: v })} />
        </div>
      </fieldset>
      <CheckGroup
        legend={filterStrings.brand}
        options={facets.brands.map((b) => ({ value: b.value, label: b.value }))}
        selected={filters.brands}
        onToggle={(v) => set('brands', v)}
      />
      <CheckGroup
        legend={filterStrings.crust}
        options={inCatalogueOrder(facets.crusts, labels?.crusts)}
        selected={filters.crusts}
        onToggle={(v) => set('crusts', v)}
      />
      <CheckGroup
        legend={filterStrings.filling}
        options={inCatalogueOrder(facets.fillings, labels?.fillings)}
        selected={filters.fillings}
        onToggle={(v) => set('fillings', v)}
      />
      <CheckGroup
        legend={filterStrings.shop}
        options={facets.vendors.map((v) => ({ value: v.vendorId, label: v.vendorName }))}
        selected={filters.shops}
        onToggle={(v) => set('shops', v)}
      />
      <p className="caption-text">{filterStrings.filterHint}</p>
    </aside>
  );
}
