import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { PageHeader, StatusBadge } from '@/shared/ui';
import styles from './AdminConfig.module.css';

/** Q6.0 */
export function ConfigHub() {
  const items = [
    { to: routes.admin.provinceFees, title: 'Phí liên tỉnh', text: 'Phí giao hộp tới từng tỉnh, thành.' },
    { to: routes.admin.vendorFee, title: 'Phí mở bán', text: 'Người bán đóng một lần trước khi mở bán.' },
    { to: routes.admin.vouchers, title: 'Voucher', text: 'Chưa làm ở bản này.', deferred: true },
    { to: routes.admin.taxonomy, title: 'Vỏ và nhân', text: 'Danh mục để người bán chọn và người mua lọc.' },
  ];
  return (
    <div className="page">
      <PageHeader title="Cấu hình" />
      <div className={styles.statGrid}>
        {items.map((i) => (
          <Link key={i.to} to={i.to} className={styles.statTile}>
            <span className="card-title-text">
              {i.title} {i.deferred && <StatusBadge tone="muted">Hoãn</StatusBadge>}
            </span>
            <span className="muted">{i.text}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Q6.3: deferred in this release. */
export function VoucherDeferred() {
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Cấu hình" title="Voucher" lead="Chưa làm ở bản này. Đặc tả hoãn voucher tới sau khi có dữ liệu đơn thật." />
      <Link to={routes.admin.config} className="mk-btn mk-btn--quiet">
        Về Cấu hình
      </Link>
    </div>
  );
}
