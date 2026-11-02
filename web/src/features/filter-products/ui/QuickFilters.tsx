import { Link } from 'react-router-dom';
import { labelOf, useCakeAttributeLabels } from '@/entities/product';
import { routes } from '@/shared/config/routes';
import { formatVnd } from '@/shared/utils/money';
import { filterLink, type ProductFilters } from '../model/filters';
import { filterStrings } from '../strings';
import styles from './QuickFilters.module.css';

const UNDER_AMOUNT = 500000;

/** Codes of the vendor catalogue seed (codes never change, L-19); labels come from the catalogue. */
const QUICK_CRUSTS = ['banh-nuong', 'banh-deo'];
const QUICK_FILLINGS = ['thap-cam', 'hat-sen', 'dau-xanh', 'tra-xanh'];

/** One row of links into "Mua hàng có sẵn" with a filter already set; only filters the list really has. */
export function QuickFilters() {
  const attributes = useCakeAttributeLabels();
  const labels = attributes.kind === 'loaded' ? attributes.data : undefined;
  const chips: { label: string; filters: Partial<ProductFilters> }[] = [
    ...QUICK_CRUSTS.map((c) => ({ label: labelOf(labels?.crusts, c), filters: { crusts: [c] } })),
    ...QUICK_FILLINGS.map((f) => ({
      label: `${filterStrings.fillingChip} ${labelOf(labels?.fillings, f).toLowerCase()}`,
      filters: { fillings: [f] },
    })),
    { label: filterStrings.under(formatVnd(UNDER_AMOUNT)), filters: { priceMax: UNDER_AMOUNT } },
  ];
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
