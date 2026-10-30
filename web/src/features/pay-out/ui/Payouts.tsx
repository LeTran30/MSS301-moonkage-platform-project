import { useState } from 'react';
import { usePayouts } from '@/entities/payout';
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { payOut } from '../api/payOutApi';
import styles from './Payouts.module.css';

/** Q4.2: pick the orders whose complaint window ended, then send. Blocked orders can not be picked. */
export function Payouts() {
  const state = usePayouts();
  const [picked, setPicked] = useState<string[]>([]);
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const open = state.data.filter((p) => !p.paid);
  const total = open.filter((p) => picked.includes(p.orderId)).reduce((s, p) => s + p.amount, 0);
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const payable = open.filter((p) => !p.blocked).map((p) => p.orderId);
  return (
    <div className="page">
      <PageHeader eyebrow="Tiền" title="Chuyển tiền cho người bán" lead="Chỉ chuyển đơn đã hết hạn khiếu nại và không có khiếu nại đang mở." />
      {open.length === 0 ? (
        <EmptyState title="Không còn đơn nào chờ chuyển" />
      ) : (
        <>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th scope="col">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả đơn chuyển được"
                    checked={payable.length > 0 && payable.every((id) => picked.includes(id))}
                    onChange={(e) => setPicked(e.target.checked ? payable : [])}
                  />
                </th>
                <th scope="col">Đơn</th>
                <th scope="col">Người bán</th>
                <th scope="col">Hết hạn khiếu nại</th>
                <th scope="col" className={styles.num}>
                  Số tiền
                </th>
              </tr>
            </thead>
            <tbody>
              {open.map((p) => (
                <tr key={p.orderId}>
                  <td>
                    <input type="checkbox" aria-label={`Chọn ${p.orderId}`} disabled={!!p.blocked} checked={picked.includes(p.orderId)} onChange={() => toggle(p.orderId)} />
                  </td>
                  <td className="mk-num">
                    {p.orderId}
                    {p.blocked && (
                      <>
                        <br />
                        <StatusBadge tone="warn">{p.blocked}</StatusBadge>
                      </>
                    )}
                  </td>
                  <td>{p.vendor}</td>
                  <td className="mk-num">{p.complaintEnds}</td>
                  <td className={`${styles.num} mk-num`}>{formatVnd(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row-between panel panel--wide">
            <span>
              Đã chọn {picked.length} đơn · <strong className="mk-num">{formatVnd(total)}</strong>
            </span>
            <button
              type="button"
              className="mk-btn mk-btn--primary"
              disabled={picked.length === 0}
              onClick={async () => {
                await payOut(picked);
                setPicked([]);
                state.reload();
              }}
            >
              Chuyển {picked.length} đơn
            </button>
          </div>
        </>
      )}
      {state.data.some((p) => p.paid) && (
        <p className="muted">Đã chuyển: {state.data.filter((p) => p.paid).map((p) => p.orderId).join(', ')}</p>
      )}
    </div>
  );
}

