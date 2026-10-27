import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { Avatar, Stars } from '../../../shared/ui';
import type { Supplier } from '../model/useSuppliers';
import { supplierStrings } from '../strings';

/** One supplier: identity, what it makes, its own minimum and reach, then the request button. */
export function SupplierCard({ supplier, layout = 'card' }: { supplier: Supplier; layout?: 'card' | 'row' }) {
  return (
    <article className={`supplier supplier--${layout}`}>
      <div className="supplier__identity">
        <Avatar initials={supplier.initials} size="lg" />
        <div>
          <h3 className="supplier__name">
            {supplier.name} {!supplier.hasShop && <span className="mk-badge mk-badge--soft">{supplierStrings.customOnly}</span>}
          </h3>
          <p className="muted">
            {supplier.district}, {supplier.city}
          </p>
        </div>
      </div>
      <p className="supplier__makes">{supplier.makes}</p>
      <div className="supplier__facts">
        <span className="mk-badge">{supplierStrings.minBoxes(supplier.minBoxes)}</span>
        <span className="mk-badge">{supplier.reach}</span>
        {layout === 'row' && <Stars value={supplier.rating} emptyLabel="" />}
      </div>
      <div className="supplier__actions">
        <Link to={routes.supplierRequest(supplier.id)} className="mk-btn mk-btn--primary mk-btn--sm">
          {supplierStrings.request(supplier.shortName)}
        </Link>
        <Link to={routes.supplier(supplier.id)} className="mk-btn mk-btn--text">
          {supplierStrings.view}
        </Link>
      </div>
    </article>
  );
}
