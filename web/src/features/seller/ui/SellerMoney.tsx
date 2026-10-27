import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { Dialog, ErrorState, LoadingState, PageHeader, StatusBadge } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { settlementTotal } from '../model/sellerModel';
import { requestDisbursement, useDisbursements, useSettlements } from '../model/useSeller';
import styles from './SellerMoney.module.css';

/** B5.0 */
export function SellerMoneyOverview({ takesCustom }: { takesCustom: boolean }) {
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
          <Link to={routes.sellerSettlements} className="mk-btn mk-btn--quiet">
            Xem đối soát
          </Link>
        </section>
        {takesCustom && (
          <section className="panel panel--wide" aria-labelledby="dis-heading">
            <h2 id="dis-heading" className="detail-heading">
              Giải ngân cọc
            </h2>
            <p className="muted">Xin giải ngân tiền cọc đơn đặt hàng theo tiến độ.</p>
            <Link to={routes.sellerDisbursements} className="mk-btn mk-btn--quiet">
              Xem giải ngân
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

/** B5.1 (simple: read-only in the demo) */
export function SellerSettlements() {
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
                <Link to={routes.sellerOrder(s.orderId)}>{s.orderId}</Link>
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

/** B5.2: ask for part of a held deposit at a production milestone; an admin approves it (Q4.1). */
export function SellerDisbursements() {
  const state = useDisbursements();
  const [open, setOpen] = useState(false);
  const [milestone, setMilestone] = useState('Đã mua nguyên liệu');
  const [amount, setAmount] = useState('3000000');
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  return (
    <div className="page">
      <PageHeader
        title="Giải ngân cọc"
        actions={
          <button type="button" className="mk-btn mk-btn--primary" onClick={() => setOpen(true)}>
            Tạo yêu cầu giải ngân
          </button>
        }
      />
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th scope="col">Đơn</th>
            <th scope="col">Mốc tiến độ</th>
            <th scope="col" className={styles.num}>
              Xin giải ngân
            </th>
            <th scope="col" className={styles.num}>
              Còn giữ sau đó
            </th>
            <th scope="col">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {state.data.map((d, i) => (
            <tr key={`${d.orderId}-${i}`}>
              <td>{d.orderId}</td>
              <td>{d.milestone}</td>
              <td className={`${styles.num} mk-num`}>{d.amount === null ? '—' : formatVnd(d.amount)}</td>
              <td className={`${styles.num} mk-num`}>{formatVnd(d.heldAfter)}</td>
              <td>
                <StatusBadge tone={d.state.startsWith('Đã') ? 'ok' : d.state.startsWith('Chờ') ? 'soft' : 'muted'}>{d.state}</StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Dialog open={open} title="Yêu cầu giải ngân · Đơn MK-C088" onClose={() => setOpen(false)}>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            await requestDisbursement('MK-C088', milestone, Number(amount) || 0);
            setOpen(false);
            state.reload();
          }}
        >
          <div className="mk-field">
            <label htmlFor="ms">Mốc tiến độ</label>
            <input id="ms" value={milestone} onChange={(e) => setMilestone(e.target.value)} />
          </div>
          <div className="mk-field">
            <label htmlFor="amt">Số tiền xin giải ngân (đ)</label>
            <input id="amt" className="mk-num" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} aria-describedby="amt-hint" />
            <span className="mk-hint" id="amt-hint">
              Đang giữ {formatVnd(9000000)} cho đơn này.
            </span>
          </div>
          <div className={styles.formActions}>
            <button type="button" className="mk-btn mk-btn--quiet" onClick={() => setOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="mk-btn mk-btn--primary">
              Gửi yêu cầu
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
