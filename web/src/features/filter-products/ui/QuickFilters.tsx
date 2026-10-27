import { Link } from 'react-router-dom';
import type { Crust, Filling } from '@/entities/product';
import { routes } from '@/shared/config/routes';
import { formatVnd } from '@/shared/utils/money';
import { crustLabels, fillingLabels, filterLink, type ProductFilters } from '../model/filters';
import { filterStrings } from '../strings';
import styles from './QuickFilters.module.css';

const UNDER_AMOUNT = 500000;

const chips: { label: string; filters: Partial<ProductFilters> }[] = [
  ...(['nuong', 'deo'] as Crust[]).map((c) => ({ label: `Vỏ ${crustLabels[c].toLowerCase()}`, filters: { crusts: [c] } })),
  ...(['thap-cam', 'hat-sen', 'dau-xanh', 'tra-xanh'] as Filling[]).map((f, i) => ({
    label: i === 0 ? `Nhân ${fillingLabels[f].toLowerCase()}` : fillingLabels[f],
    filters: { fillings: [f] },
  })),
  { label: filterStrings.under(formatVnd(UNDER_AMOUNT)), filters: { priceMax: UNDER_AMOUNT } },
];

/** One row of links into "Mua hàng có sẵn" with a filter already set; only filters the list really has. */
export function QuickFilters() {
  return (
    <nav className={`${styles.quickFilters} quick-filters`} aria-label={filterStrings.quickTitle}>
      <span className={`${styles.label} quick-filters__label`}>{filterStrings.quickTitle}</span>
      {chips.map((chip) => (
        <Link key={chip.label} to={`${routes.base.products}${filterLink(chip.filters)}`} className={`mk-chip ${styles.chip} quick-filters__chip`}>
          {chip.label}
        </Link>
      ))}
      <Link to={routes.base.products} className={`mk-chip ${styles.chip} ${styles.all} quick-filters__chip quick-filters__all`}>
        {filterStrings.allFilters}
      </Link>
    </nav>
  );
}
