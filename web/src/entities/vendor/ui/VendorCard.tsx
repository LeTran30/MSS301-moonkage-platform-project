import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { Avatar, Stars } from '@/shared/ui';
import type { VendorSummary } from '../model/useVendorDirectory';
import { vendorDirectoryStrings } from '../strings';
import styles from './VendorCard.module.css';

/** One vendor: identity, what it makes, its own minimum and reach, then the request button. */
export function VendorCard({ vendor, layout = 'card' }: { vendor: VendorSummary; layout?: 'card' | 'row' }) {
  return (
    <article className={`${styles.vendor} ${layout === 'row' ? styles.vendorRow : ''} vendor vendor--${layout}`}>
      <div className={`${styles.identity} vendor__identity`}>
        <Avatar initials={vendor.initials} size="lg" />
        <div>
          <h3 className={`${styles.name} vendor__name`}>
            {vendor.name} {!vendor.hasShop && <span className="mk-badge mk-badge--soft">{vendorDirectoryStrings.customOnly}</span>}
          </h3>
          <p className="muted">
            {vendor.district}, {vendor.city}
          </p>
        </div>
      </div>
      <p className={`${styles.makes} vendor__makes`}>{vendor.makes}</p>
      <div className={`${styles.facts} vendor__facts`}>
        <span className="mk-badge">{vendorDirectoryStrings.minBoxes(vendor.minBoxes)}</span>
        <span className="mk-badge">{vendor.reach}</span>
        {layout === 'row' && <Stars value={vendor.rating} emptyLabel="" />}
      </div>
      <div className={`${styles.actions} vendor__actions`}>
        <Link to={routes.base.directRequest(vendor.id)} className="mk-btn mk-btn--primary mk-btn--sm">
          {vendorDirectoryStrings.request(vendor.shortName)}
        </Link>
        <Link to={routes.base.vendorStorefront(vendor.id)} className="mk-btn mk-btn--text">
          {vendorDirectoryStrings.view}
        </Link>
      </div>
    </article>
  );
}
