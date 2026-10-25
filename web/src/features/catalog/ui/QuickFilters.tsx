import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { formatVnd } from '../../../shared/utils/money';
import type { Crust, Filling } from '../api/types';
import { crustLabels, fillingLabels, filterLink, type ProductFilters } from '../model/filters';
import { catalogStrings } from '../strings';

const UNDER_AMOUNT = 500000;

const chips: { label: string; filters: Partial<ProductFilters> }[] = [
  ...(['nuong', 'deo'] as Crust[]).map((c) => ({ label: `Vỏ ${crustLabels[c].toLowerCase()}`, filters: { crusts: [c] } })),
  ...(['thap-cam', 'hat-sen', 'dau-xanh', 'tra-xanh'] as Filling[]).map((f, i) => ({
    label: i === 0 ? `Nhân ${fillingLabels[f].toLowerCase()}` : fillingLabels[f],
    filters: { fillings: [f] },
  })),
  { label: catalogStrings.under(formatVnd(UNDER_AMOUNT)), filters: { priceMax: UNDER_AMOUNT } },
];

/** One row of links into "Mua hàng có sẵn" with a filter already set; only filters the list really has. */
export function QuickFilters() {
  return (
    <nav className="quick-filters" aria-label={catalogStrings.quickTitle}>
      <span className="quick-filters__label">{catalogStrings.quickTitle}</span>
      {chips.map((chip) => (
        <Link key={chip.label} to={`${routes.products}${filterLink(chip.filters)}`} className="mk-chip quick-filters__chip">
          {chip.label}
        </Link>
      ))}
      <Link to={routes.products} className="mk-chip quick-filters__chip quick-filters__all">
        {catalogStrings.allFilters}
      </Link>
    </nav>
  );
}
