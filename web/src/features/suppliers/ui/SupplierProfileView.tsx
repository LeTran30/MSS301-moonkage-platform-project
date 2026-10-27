import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { Avatar, KeyValue, StatusBadge } from '../../../shared/ui';
import { formatRating } from '../../../shared/utils/money';
import type { SupplierProfile } from '../model/useSuppliers';
import { supplierStrings } from '../strings';

/** M3.3: who the supplier is, what it makes to order, its conditions; `products` is its Shop (from the catalogue). */
export function SupplierProfileView({ supplier, products, productCount }: { supplier: SupplierProfile; products?: ReactNode; productCount: number }) {
  return (
    <div className="page">
      <header className="supplier-hero">
        <Avatar initials={supplier.initials} size="lg" />
        <div className="stack supplier-hero__text">
          <h1 className="title-text">{supplier.name}</h1>
          <p className="muted">
            {supplier.address}
            {supplier.rating !== null && ` · ${formatRating(supplier.rating)} ★ (${supplier.purchases} lượt mua)`}
          </p>
          <div className="row">
            {supplier.hasShop && <StatusBadge>Có Shop</StatusBadge>}
            <StatusBadge tone="soft">Nhận đặt hàng</StatusBadge>
          </div>
        </div>
        <Link to={routes.supplierRequest(supplier.id)} className="mk-btn mk-btn--primary">
          {supplierStrings.request(supplier.shortName)}
        </Link>
      </header>

      {supplier.hasShop && products && (
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
          <KeyValue rows={supplier.makesDetail} />
        </section>
        <section className="panel panel--wide" aria-labelledby="terms-heading">
          <h2 id="terms-heading" className="detail-heading">
            Điều kiện
          </h2>
          <KeyValue rows={supplier.terms} />
        </section>
      </div>

      <section className="nudge" aria-labelledby="custom-heading">
        <div>
          <h2 id="custom-heading" className="nudge__title">
            Cần làm riêng với đơn vị này?
          </h2>
          <p className="muted">Gửi yêu cầu, đơn vị trả báo giá trong Yêu cầu và báo giá của bạn.</p>
        </div>
        <Link to={routes.supplierRequest(supplier.id)} className="mk-btn mk-btn--outline">
          {supplierStrings.request(supplier.shortName)}
        </Link>
      </section>
    </div>
  );
}
