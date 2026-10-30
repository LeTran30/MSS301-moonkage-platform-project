import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { Avatar, KeyValue, StatusBadge } from '@/shared/ui';
import { formatRating } from '@/shared/utils/money';
import type { VendorStorefront } from '../model/useVendorDirectory';
import { vendorDirectoryStrings } from '../strings';
import styles from './VendorStorefrontView.module.css';

/** M3.3: who the vendor is, what it makes to order, its conditions; `products` is its Shop (from the catalogue). */
export function VendorStorefrontView({ vendor, products, productCount }: { vendor: VendorStorefront; products?: ReactNode; productCount: number }) {
  return (
    <div className="page">
      <header className={`${styles.hero} vendor-hero`}>
        <Avatar initials={vendor.initials} size="lg" />
        <div className={`stack ${styles.heroText} vendor-hero__text`}>
          <h1 className="title-text">{vendor.name}</h1>
          <p className="muted">
            {vendor.address}
            {vendor.rating !== null && ` · ${formatRating(vendor.rating)} ★ (${vendor.purchases} lượt mua)`}
          </p>
          <div className="row">
            {vendor.hasShop && <StatusBadge>Có Shop</StatusBadge>}
            <StatusBadge tone="soft">Nhận đặt hàng</StatusBadge>
          </div>
        </div>
        <Link to={routes.base.directRequest(vendor.id)} className="mk-btn mk-btn--primary">
          {vendorDirectoryStrings.request(vendor.shortName)}
        </Link>
      </header>

      {vendor.hasShop && products && (
        <section aria-labelledby="shop-heading">
          <div className="mk-section-head">
            <h2 id="shop-heading">Hàng có sẵn ({productCount})</h2>
          </div>
          {products}
        </section>
      )}

      <div className="grid-2">
        <section className="panel panel--wide" aria-labelledby="makes-heading">
          <h2 id="makes-heading" className="detail-heading">
            Nhận làm
          </h2>
          <KeyValue rows={vendor.makesDetail} />
        </section>
        <section className="panel panel--wide" aria-labelledby="terms-heading">
          <h2 id="terms-heading" className="detail-heading">
            Điều kiện
          </h2>
          <KeyValue rows={vendor.terms} />
        </section>
      </div>

      <section className="nudge" aria-labelledby="custom-heading">
        <div>
          <h2 id="custom-heading" className="nudge__title">
            Cần làm riêng với đơn vị này?
          </h2>
          <p className="muted">Gửi yêu cầu, đơn vị trả báo giá trong Yêu cầu và báo giá của bạn.</p>
        </div>
        <Link to={routes.base.directRequest(vendor.id)} className="mk-btn mk-btn--outline">
          {vendorDirectoryStrings.request(vendor.shortName)}
        </Link>
      </section>
    </div>
  );
}
