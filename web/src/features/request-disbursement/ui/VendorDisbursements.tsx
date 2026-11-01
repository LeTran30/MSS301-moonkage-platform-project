import { useState } from 'react';
import { DISBURSEMENT_PURPOSES, useDisbursableOrders, useDisbursements } from '@/entities/payout';
import { useAction } from '@/shared/lib';
import { Dialog, ErrorState, LoadingState, PageHeader, StatusBadge } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { requestDisbursement, type DisbursementPurpose } from '../api/requestDisbursementApi';
import styles from './VendorDisbursements.module.css';

/** B5.2: ask for part of a held deposit for a production need; an admin approves it (Q4.1). */
export function VendorDisbursements() {
  const state = useDisbursements();
  const orders = useDisbursableOrders();
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [purpose, setPurpose] = useState<DisbursementPurpose>(DISBURSEMENT_PURPOSES[0].code);
  const [amount, setAmount] = useState('');
  const send = useAction();
  if (state.kind === 'loading' || orders.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const disbursable = orders.kind === 'loaded' ? orders.data : [];
  const chosen = disbursable.find((o) => o.orderId === orderId) ?? disbursable[0];
  const value = Number(amount) || 0;
  const tooMuch = chosen ? value > chosen.held : false;
  return (
    <div className="page">
      <PageHeader
        title="Giải ngân cọc"
        actions={
          <button type="button" className="mk-btn mk-btn--primary" disabled={disbursable.length === 0} onClick={() => setOpen(true)}>
            Tạo yêu cầu giải ngân
          </button>
        }
      />
      {disbursable.length === 0 && <p className="muted">Chưa có đơn đặt hàng nào đang giữ cọc để xin giải ngân.</p>}
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
      <Dialog open={open && Boolean(chosen)} title="Yêu cầu giải ngân" onClose={() => setOpen(false)}>
        {chosen && (
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              if (value <= 0 || tooMuch) return;
              if (await send.run(() => requestDisbursement(chosen.orderId, purpose, value, chosen.held))) {
                setOpen(false);
                setAmount('');
                state.reload();
                orders.reload();
              }
            }}
          >
            <div className="mk-field">
              <label htmlFor="dis-order">Đơn</label>
              <select id="dis-order" value={chosen.orderId} onChange={(e) => setOrderId(e.target.value)}>
                {disbursable.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    {o.orderId}
                  </option>
                ))}
              </select>
            </div>
            <div className="mk-field">
              <label htmlFor="ms">Dùng để</label>
              <select id="ms" value={purpose} onChange={(e) => setPurpose(e.target.value as DisbursementPurpose)}>
                {DISBURSEMENT_PURPOSES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={`mk-field${tooMuch ? ' mk-field--error' : ''}`}>
              <label htmlFor="amt">Số tiền xin giải ngân (đ)</label>
              <input id="amt" className="mk-num" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} aria-describedby="amt-hint" />
              <span className="mk-hint" id="amt-hint">
                {tooMuch ? 'Không xin quá số Moonkage đang giữ.' : `Đang giữ ${formatVnd(chosen.held)} cho đơn này.`}
              </span>
            </div>
            {send.error && (
              <p className="error-text" role="alert">
                {send.error}
              </p>
            )}
            <div className={styles.formActions}>
              <button type="button" className="mk-btn mk-btn--quiet" onClick={() => setOpen(false)}>
                Hủy
              </button>
              <button type="submit" className="mk-btn mk-btn--primary" disabled={value <= 0 || tooMuch || send.busy}>
                Gửi yêu cầu
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
