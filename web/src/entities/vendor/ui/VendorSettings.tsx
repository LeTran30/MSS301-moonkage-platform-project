import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { KeyValue, PageHeader, StatusBadge } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import type { VendorProfile } from '../model/types';
import styles from './VendorSettings.module.css';

/** B6.0 */
export function SettingsHub({ profile }: { profile: VendorProfile }) {
  const open = profile.state === 'open';
  const rows = [
    { title: 'Thông tin pháp lý', body: 'Hồ sơ đã nộp, hóa đơn phí mở bán', badge: open ? 'Đã duyệt · chỉ xem' : 'Chờ duyệt', to: routes.vendor.legal, enabled: true },
    { title: 'Vùng giao và phí giao', body: 'Nơi Shop giao tới và phí từng vùng', badge: open ? 'Đã cài' : 'Mở sau khi duyệt', to: routes.vendor.zones, enabled: open },
    { title: 'Điều kiện nhận đặt hàng', body: 'Số hộp tối thiểu, vỏ và nhân làm được, thời gian maket', badge: open ? 'Đã cài' : 'Mở sau khi duyệt', to: routes.vendor.terms, enabled: open },
    { title: 'Lịch công suất', body: 'Số hộp nhận được mỗi ngày', badge: 'Hoãn trong demo', to: routes.vendor.capacity, enabled: true },
  ];
  return (
    <div className="page">
      <PageHeader title="Cài đặt bán hàng" />
      <ul className={styles.rowList}>
        {rows.map((r) => (
          <li key={r.title} className={styles.rowItem}>
            <div className={styles.rowMain}>
              <p className={styles.rowTitle}>{r.title}</p>
              <p className="muted">{r.body}</p>
            </div>
            <StatusBadge tone={r.enabled ? 'soft' : 'muted'}>{r.badge}</StatusBadge>
            {r.enabled ? (
              <Link to={r.to} className="mk-btn mk-btn--quiet mk-btn--sm">
                Mở
              </Link>
            ) : (
              <button type="button" className="mk-btn mk-btn--sm" disabled>
                Mở
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** B6.1: the submitted profile, read-only once approved; re-submit (`onResubmit`) when more is needed. */
export function LegalInfo({ profile, onResubmit }: { profile: VendorProfile; onResubmit: () => void }) {
  return (
    <div className="page page--narrow">
      <PageHeader
        title="Thông tin pháp lý"
        lead={
          <>
            {profile.shopName} · {profile.kind.toLowerCase()}{' '}
            {profile.state === 'open' || profile.state === 'approved' ? (
              <StatusBadge tone="ok">{`Đã duyệt ${profile.approvedAt ?? ''} · chỉ xem`}</StatusBadge>
            ) : profile.state === 'needs-more' ? (
              <StatusBadge tone="warn">Cần bổ sung</StatusBadge>
            ) : (
              <StatusBadge tone="soft">Chờ duyệt · chỉ xem</StatusBadge>
            )}
          </>
        }
      />
      {profile.state === 'needs-more' && (
        <div className="notice row-between">
          <span>Moonkage cần: {profile.moreNeeded}</span>
          <button type="button" className="mk-btn mk-btn--primary mk-btn--sm" onClick={onResubmit}>
            Nộp lại
          </button>
        </div>
      )}
      <section className="panel panel--wide" aria-labelledby="unit-h">
        <h2 id="unit-h" className="detail-heading">
          Đơn vị
        </h2>
        <KeyValue
          rows={[
            { label: 'Tên', value: profile.shopName },
            { label: 'Mã đăng ký', value: profile.regNo },
            { label: 'Địa chỉ', value: profile.address },
          ]}
        />
      </section>
      <section className="panel panel--wide" aria-labelledby="owner-h">
        <h2 id="owner-h" className="detail-heading">
          Chủ hộ
        </h2>
        <KeyValue
          rows={[
            { label: 'Họ tên', value: profile.ownerName },
            { label: 'Số định danh', value: profile.ownerId },
          ]}
        />
      </section>
      <section className="panel panel--wide" aria-labelledby="docs-h">
        <h2 id="docs-h" className="detail-heading">
          Giấy tờ
        </h2>
        <ul className={styles.rowList}>
          {['Giấy đăng ký hộ kinh doanh', 'Giấy an toàn thực phẩm', ...(profile.state === 'open' ? [`Hóa đơn phí mở bán ${formatVnd(200000)}`] : [])].map((d) => (
            <li key={d} className={styles.rowItem}>
              <span className="mk-badge">PDF</span>
              <span className={styles.rowMain}>{d}</span>
              <button type="button" className="mk-btn mk-btn--text">
                {d.startsWith('Hóa đơn') ? 'Tải' : 'Xem'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** B6.4 (deferred in the demo) */
export function CapacityDeferred() {
  return (
    <div className="page page--narrow">
      <StatusBadge tone="muted">Hoãn trong demo</StatusBadge>
      <PageHeader title="Lịch công suất" lead="Chưa làm trong bản demo (FR-37)." />
      <Link to={routes.vendor.settings} className="mk-btn mk-btn--quiet">
        ‹ Cài đặt bán hàng
      </Link>
    </div>
  );
}
