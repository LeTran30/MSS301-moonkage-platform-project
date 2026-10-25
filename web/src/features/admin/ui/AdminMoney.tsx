import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { EmptyState, ErrorState, KeyValue, LoadingState, PageHeader, StatusBadge, Tabs } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { decideDisbursement, payOut } from '../api/adminApi';
import { mismatches } from '../model/adminModel';
import { useDisbursementRequests, usePayouts, useReconciliation } from '../model/useAdmin';

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
    { label: 'Giải ngân cọc chờ duyệt', value: `${waiting} yêu cầu`, to: routes.adminDisbursements, go: 'Duyệt giải ngân' },
    { label: 'Đơn hết hạn khiếu nại, chờ chuyển', value: formatVnd(toPay.reduce((s, p) => s + p.amount, 0)), to: routes.adminPayouts, go: 'Chuyển tiền' },
    { label: 'Dòng lệch trong đối soát', value: `${off} dòng`, to: routes.adminReconciliation, go: 'Đối soát' },
  ];
  return (
    <div className="page">
      <PageHeader title="Tiền" lead="Moonkage giữ tiền của người mua tới khi đủ điều kiện chuyển cho người bán." />
      <div className="stat-grid">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="stat-tile">
            <span className="muted">{t.label}</span>
            <span className="stat-tile__num mk-num">{t.value}</span>
            <span className="stat-tile__go">{t.go}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Q4.1: approve or refuse each deposit release; the amount can not exceed what is held. */
export function DisbursementApprovals() {
  const state = useDisbursementRequests();
  const [tab, setTab] = useState<'waiting' | 'done'>('waiting');
  const [refusals, setRefusals] = useState<Record<string, string>>({});
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const list = state.data.filter((d) => (tab === 'waiting' ? d.state === 'waiting' : d.state !== 'waiting'));
  const decide = async (id: string, approve: boolean) => {
    await decideDisbursement(id, approve, refusals[id]?.trim());
    state.reload();
  };
  return (
    <div className="page">
      <PageHeader eyebrow="Tiền" title="Duyệt giải ngân cọc" lead="Người bán xin nhận một phần cọc khi đơn đặt riêng qua một mốc." />
      <Tabs
        label="Trạng thái"
        current={tab}
        onChange={setTab}
        tabs={[
          { key: 'waiting', label: 'Chờ duyệt', count: state.data.filter((d) => d.state === 'waiting').length },
          { key: 'done', label: 'Đã xử lý' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title="Không có yêu cầu nào" />
      ) : (
        list.map((d) => (
          <article key={d.id} className="panel panel--wide stack">
            <div className="row-between">
              <h2 className="card-title-text">
                {d.id} · đơn {d.orderId} · {d.seller}
              </h2>
              {d.state !== 'waiting' && <StatusBadge tone={d.state === 'approved' ? 'ok' : 'muted'}>{d.state === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}</StatusBadge>}
            </div>
            <KeyValue
              rows={[
                { label: 'Mốc', value: d.milestone },
                { label: 'Xin giải ngân', value: <strong className="mk-num">{formatVnd(d.amount)}</strong> },
                { label: 'Moonkage đang giữ', value: <span className="mk-num">{formatVnd(d.heldNow)}</span> },
                { label: 'Đã giải ngân trước', value: <span className="mk-num">{formatVnd(d.disbursedBefore)}</span> },
                { label: 'Gửi lúc', value: d.askedAt },
                ...(d.refusal ? [{ label: 'Lý do từ chối', value: d.refusal }] : []),
              ]}
            />
            {d.state === 'waiting' && (
              <div className="row">
                <button type="button" className="mk-btn mk-btn--primary" disabled={d.amount > d.heldNow} onClick={() => decide(d.id, true)}>
                  Duyệt {formatVnd(d.amount)}
                </button>
                <input
                  className="cell-input"
                  aria-label={`Lý do từ chối ${d.id}`}
                  placeholder="Lý do từ chối"
                  value={refusals[d.id] ?? ''}
                  onChange={(e) => setRefusals({ ...refusals, [d.id]: e.target.value })}
                />
                <button type="button" className="mk-btn mk-btn--quiet" disabled={!refusals[d.id]?.trim()} onClick={() => decide(d.id, false)}>
                  Từ chối
                </button>
              </div>
            )}
            {d.state === 'waiting' && d.amount > d.heldNow && <p className="error-text">Số xin vượt số Moonkage đang giữ.</p>}
          </article>
        ))
      )}
    </div>
  );
}

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
          <table className="data-table">
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
                <th scope="col" className="num">
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
                  <td>{p.seller}</td>
                  <td className="mk-num">{p.complaintEnds}</td>
                  <td className="num mk-num">{formatVnd(p.amount)}</td>
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
          { label: 'Phí mở bán thu được', value: <span className="mk-num">{formatVnd(r.sellerFees)}</span> },
        ]}
      />
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Mã</th>
            <th scope="col">Loại</th>
            <th scope="col" className="num">
              VNPay
            </th>
            <th scope="col" className="num">
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
                <td className="num mk-num">{formatVnd(row.vnpay)}</td>
                <td className="num mk-num">{formatVnd(row.system)}</td>
                <td>{diff === 0 ? <StatusBadge tone="ok">Khớp</StatusBadge> : <StatusBadge tone="warn">{`Lệch ${formatVnd(Math.abs(diff))}`}</StatusBadge>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
