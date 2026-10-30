import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { settlementTotal } from '../model/payoutModel';
import { useSettlements } from '../model/usePayouts';
import styles from './VendorMoney.module.css';

/** B5.0 */
export function VendorMoneyOverview({ takesCustom }: { takesCustom: boolean }) {
  return (
    <div className="page">
      <PageHeader title="Tiền" />
      <div className={styles.statGrid}>
        <div className={styles.statTile}>
          <span className="muted">Moonkage đang giữ</span>
          <span className={`${styles.statNum} mk-num`}>{formatVnd(9840000)}</span>
        </div>
        <div className={styles.statTile}>
          <span className="muted">Chờ chuyển cho bạn</span>
          <span className={`${styles.statNum} mk-num`}>{formatVnd(1360000)}</span>
        </div>
        <div className={styles.statTile}>
          <span className="muted">Đã nhận tháng 10/2026</span>
          <span className={`${styles.statNum} mk-num`}>{formatVnd(12400000)}</span>
        </div>
      </div>
      <div className="grid-2">
        <section className="panel panel--wide" aria-labelledby="rec-heading">
          <h2 id="rec-heading" className="detail-heading">
            Đối soát
          </h2>
          <p className="muted">Từng đơn đã giao: tiền hàng, phí giao, ngày chuyển.</p>
          <Link to={routes.vendor.settlements} className="mk-btn mk-btn--quiet">
            Xem đối soát
          </Link>
        </section>
        {takesCustom && (
          <section className="panel panel--wide" aria-labelledby="dis-heading">
            <h2 id="dis-heading" className="detail-heading">
              Giải ngân cọc
            </h2>
            <p className="muted">Xin giải ngân tiền cọc đơn đặt hàng theo tiến độ.</p>
            <Link to={routes.vendor.disbursements} className="mk-btn mk-btn--quiet">
              Xem giải ngân
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

/** B5.1 (simple: read-only in the demo) */
export function VendorSettlements() {
  const state = useSettlements();
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  return (
    <div className="page">
      <PageHeader title="Đối soát" lead="Tiền hàng và phí giao của từng đơn đã giao, và ngày Moonkage chuyển cho bạn." />
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th scope="col">Đơn</th>
            <th scope="col">Giao xong</th>
            <th scope="col" className={styles.num}>
              Tiền hàng
            </th>
            <th scope="col" className={styles.num}>
              Phí giao
            </th>
            <th scope="col" className={styles.num}>
              Bạn nhận
            </th>
            <th scope="col">Chuyển</th>
          </tr>
        </thead>
        <tbody>
          {state.data.map((s) => (
            <tr key={s.orderId}>
              <td>
                <Link to={routes.vendor.order(s.orderId)}>{s.orderId}</Link>
              </td>
              <td className="mk-num">{s.deliveredAt}</td>
              <td className={`${styles.num} mk-num`}>{formatVnd(s.goods)}</td>
              <td className={`${styles.num} mk-num`}>{formatVnd(s.shipping)}</td>
              <td className={`${styles.num} mk-num`}>
                <strong>{formatVnd(settlementTotal(s))}</strong>
              </td>
              <td>
                <StatusBadge tone={s.state.startsWith('Đã') ? 'ok' : s.state.includes('khiếu nại') ? 'warn' : 'soft'}>{s.state}</StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

