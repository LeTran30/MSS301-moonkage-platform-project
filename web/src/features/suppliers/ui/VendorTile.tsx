import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import type { Supplier } from '../model/useSuppliers';
import { supplierStrings } from '../strings';

/** DS VendorTile (mk-vendor): initials in a white ring, the name, one line of real conditions. */
export function VendorTile({ supplier }: { supplier: Supplier }) {
  return (
    <Link to={routes.supplier(supplier.id)} className="mk-vendor">
      <span className="mk-vendor__mark" aria-hidden="true">
        {supplier.initials}
      </span>
      <span>
        <span className="mk-vendor__name">{supplier.name}</span>
        <span className="mk-vendor__meta">{supplierStrings.tileMeta(supplier)}</span>
      </span>
    </Link>
  );
}
