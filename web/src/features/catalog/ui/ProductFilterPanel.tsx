import { useState } from 'react';
import { crustLabels, fillingLabels, type Crust, type Filling, type ProductFilters } from '../model/filters';
import type { ProductSummary } from '../model/useCatalog';
import { catalogStrings } from '../strings';

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
    <fieldset className="filter-group">
      <legend className="filter-group__legend">{legend}</legend>
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

/** Left column of M2.0. Options come from the products of the area, so no option leads to an empty list by itself. */
export function ProductFilterPanel({
  products,
  filters,
  onChange,
}: {
  products: ProductSummary[];
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
}) {
  const unique = (pick: (p: ProductSummary) => string[]) => [...new Set(products.flatMap(pick))];
  const crusts = unique((p) => [p.crust]) as Crust[];
  const fillings = unique((p) => p.fillings) as Filling[];
  const set = (key: ListKey, value: string) =>
    onChange({ ...filters, [key]: toggle(filters[key] as string[], value) });

  return (
    <aside className="filter-panel" aria-labelledby="filter-heading">
      <h2 id="filter-heading" className="filter-panel__title">
        {catalogStrings.filters}
      </h2>
      <fieldset className="filter-group">
        <legend className="filter-group__legend">{catalogStrings.price}</legend>
        <div className="filter-panel__price">
          <PriceInput key={`min-${filters.priceMin}`} id="price-min" label={catalogStrings.priceFrom} value={filters.priceMin} onCommit={(v) => onChange({ ...filters, priceMin: v })} />
          <PriceInput key={`max-${filters.priceMax}`} id="price-max" label={catalogStrings.priceTo} value={filters.priceMax} onCommit={(v) => onChange({ ...filters, priceMax: v })} />
        </div>
      </fieldset>
      <CheckGroup
        legend={catalogStrings.brand}
        options={unique((p) => [p.brand]).map((b) => ({ value: b, label: b }))}
        selected={filters.brands}
        onToggle={(v) => set('brands', v)}
      />
      <CheckGroup
        legend={catalogStrings.crust}
        options={(Object.keys(crustLabels) as Crust[]).filter((c) => crusts.includes(c)).map((c) => ({ value: c, label: crustLabels[c] }))}
        selected={filters.crusts}
        onToggle={(v) => set('crusts', v)}
      />
      <CheckGroup
        legend={catalogStrings.filling}
        options={(Object.keys(fillingLabels) as Filling[]).filter((f) => fillings.includes(f)).map((f) => ({ value: f, label: fillingLabels[f] }))}
        selected={filters.fillings}
        onToggle={(v) => set('fillings', v)}
      />
      <CheckGroup
        legend={catalogStrings.shop}
        options={unique((p) => [p.shopName]).map((s) => ({ value: s, label: s }))}
        selected={filters.shops}
        onToggle={(v) => set('shops', v)}
      />
      <p className="caption-text">{catalogStrings.filterHint}</p>
    </aside>
  );
}
