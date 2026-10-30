import { Link } from 'react-router-dom';
import { routes } from '@/shared/config/routes';
import { ErrorState, KeyValue, LoadingState, PageHeader, StatusBadge } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { mismatches } from '../model/payoutModel';
import { useDisbursementRequests, usePayouts, useReconciliation } from '../model/usePayouts';
import styles from './AdminMoney.module.css';

/** Q4.0: the three money jobs. */
export function AdminMoneyHub() {
  const dis = useDisbursementRequests();
  const pay = usePayouts();
  const rec = useReconciliation();
  if ([dis, pay, rec].some((s) => s.kind === 'loading')) return <LoadingState />;
  const waiting = dis.kind === 'loaded' ? dis.data.filter((d) => d.state === 'waiting').length : 0;
  const toPay = pay.kind === 'loaded' ? pay.data.filter((p) => !p.paid && !p.blocked) : [];
  const off = rec.kind === 'loaded' ? mismatches(rec.data).length : 0;
  const tiles = [
    { label: 'Giải ngân cọc chờ duyệt', value: `${waiting} yêu cầu`, to: routes.admin.disbursements, go: 'Duyệt giải ngân' },
    { label: 'Đơn hết hạn khiếu nại, chờ chuyển', value: formatVnd(toPay.reduce((s, p) => s + p.amount, 0)), to: routes.admin.payouts, go: 'Chuyển tiền' },
    { label: 'Dòng lệch trong đối soát', value: `${off} dòng`, to: routes.admin.reconciliation, go: 'Đối soát' },
  ];
  return (
    <div className="page">
      <PageHeader title="Tiền" lead="Moonkage giữ tiền của người mua tới khi đủ điều kiện chuyển cho người bán." />
      <div className={styles.statGrid}>
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className={styles.statTile}>
            <span className="muted">{t.label}</span>
            <span className={`${styles.statNum} mk-num`}>{t.value}</span>
            <span className={styles.statGo}>{t.go}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Q4.3: money in (VNPay) against money held and paid out; rows that disagree first. */
export function ReconciliationView() {
  const state = useReconciliation();
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const r = state.data;
  const off = mismatches(r);
  const rows = [...off, ...r.rows.filter((x) => !off.includes(x))];
  return (
    <div className="page">
      <PageHeader eyebrow="Tiền" title={`Đối soát ${r.month}`} />
      <KeyValue
        rows={[
          { label: 'VNPay báo về', value: <span className="mk-num">{formatVnd(r.vnpay)}</span> },
          { label: 'Moonkage đang giữ', value: <span className="mk-num">{formatVnd(r.held)}</span> },
          { label: 'Đã chuyển người bán', value: <span className="mk-num">{formatVnd(r.paidOut)}</span> },
          { label: 'Phí mở bán thu được', value: <span className="mk-num">{formatVnd(r.vendorFees)}</span> },
        ]}
      />
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th scope="col">Mã</th>
            <th scope="col">Loại</th>
            <th scope="col" className={styles.num}>
              VNPay
            </th>
            <th scope="col" className={styles.num}>
              Hệ thống
            </th>
            <th scope="col">Kết quả</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const diff = row.vnpay - row.system;
            return (
              <tr key={row.id}>
                <td className="mk-num">{row.id}</td>
                <td>{row.kind}</td>
                <td className={`${styles.num} mk-num`}>{formatVnd(row.vnpay)}</td>
                <td className={`${styles.num} mk-num`}>{formatVnd(row.system)}</td>
                <td>{diff === 0 ? <StatusBadge tone="ok">Khớp</StatusBadge> : <StatusBadge tone="warn">{`Lệch ${formatVnd(Math.abs(diff))}`}</StatusBadge>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
