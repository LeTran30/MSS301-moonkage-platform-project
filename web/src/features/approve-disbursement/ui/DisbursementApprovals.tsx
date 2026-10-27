import { useState } from 'react';
import { useDisbursementRequests } from '@/entities/payout';
import { EmptyState, ErrorState, KeyValue, LoadingState, PageHeader, StatusBadge, Tabs } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { decideDisbursement } from '../api/approveDisbursementApi';
import styles from './DisbursementApprovals.module.css';

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
                {d.id} · đơn {d.orderId} · {d.vendor}
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
                  className={styles.cellInput}
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

