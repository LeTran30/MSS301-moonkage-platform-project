import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import type { VendorSummary } from '../model/useVendorDirectory';
import { vendorDirectoryStrings } from '../strings';
import styles from './VendorTile.module.css';

/** DS VendorTile (mk-vendor): initials in a white ring, the name, one line of real conditions. */
export function VendorTile({ vendor }: { vendor: VendorSummary }) {
  return (
    <Link to={routes.base.vendorStorefront(vendor.id)} className={`${styles.vendor} mk-vendor`}>
      <span className={`${styles.mark} mk-vendor__mark`} aria-hidden="true">
        {vendor.initials}
      </span>
      <span>
        <span className={`${styles.name} mk-vendor__name`}>{vendor.name}</span>
        <span className={`${styles.meta} mk-vendor__meta`}>{vendorDirectoryStrings.tileMeta(vendor)}</span>
      </span>
    </Link>
  );
}
