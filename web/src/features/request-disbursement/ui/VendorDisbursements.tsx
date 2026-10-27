import { useState } from 'react';
import { useDisbursements } from '@/entities/payout';
import { Dialog, ErrorState, LoadingState, PageHeader, StatusBadge } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { requestDisbursement } from '../api/requestDisbursementApi';
import styles from './VendorDisbursements.module.css';

/** B5.2: ask for part of a held deposit at a production milestone; an admin approves it (Q4.1). */
export function VendorDisbursements() {
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
