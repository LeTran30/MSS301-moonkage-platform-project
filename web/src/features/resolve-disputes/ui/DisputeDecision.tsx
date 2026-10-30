import { useState } from 'react';
import { disputeStateLabel as stateLabel, maxRefund, type Dispute } from '@/entities/dispute';
import { KeyValue, PageHeader, StatusBadge } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { decideDispute } from '../api/decideDisputeApi';
import styles from './DisputeDecision.module.css';

const KINDS = ['Hoàn một phần', 'Hoàn toàn bộ', 'Không hoàn'] as const;

/** Q5.1: both sides, the money held, and a decision that can not refund more than is held. */
export function DisputeDecision({ dispute: d, onChanged }: { dispute: Dispute; onChanged: () => void }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]>('Hoàn một phần');
  const [amount, setAmount] = useState(d.vendorProposal?.amount ?? 0);
  const [note, setNote] = useState('');
  const max = maxRefund(d);
  const value = kind === 'Hoàn toàn bộ' ? max : kind === 'Không hoàn' ? 0 : amount;
  const tooMuch = value > max;
  const label = stateLabel[d.state];
  return (
    <div className="page">
      <PageHeader
        eyebrow="Khiếu nại"
        title={
          <>
            {d.id} · đơn {d.orderId} <StatusBadge tone={label.tone}>{label.label}</StatusBadge>
          </>
        }
        lead={`${d.buyer} ↔ ${d.vendor} · mở ${d.openedAt}`}
      />
      <div className={styles.detailLayout}>
        <div className="stack">
          <section className="panel panel--wide">
            <h2 className="detail-heading">Người mua nói</h2>
            <p>
              <strong>{d.reason}.</strong> {d.buyerText}
            </p>
            <div className="grid-2">
              {['Ảnh người mua gửi 1', 'Ảnh người mua gửi 2'].map((x) => (
                <div key={x} className={styles.mockupFrame}>
                  {x}
                </div>
              ))}
            </div>
          </section>
          <section className="panel panel--wide">
            <h2 className="detail-heading">Người bán đề xuất</h2>
            {d.vendorProposal ? (
              <p>
                {d.vendorProposal.kind} <strong className="mk-num">{formatVnd(d.vendorProposal.amount)}</strong>. {d.vendorProposal.note}
              </p>
            ) : (
              <p className="muted">Người bán chưa đề xuất.</p>
            )}
          </section>
          <section className="panel panel--wide">
            <h2 className="detail-heading">Đơn và tiền</h2>
            <KeyValue
              rows={[
                ...d.lines.map((l) => ({ label: l.name, value: <span className="mk-num">{formatVnd(l.amount)}</span> })),
                { label: 'Moonkage đang giữ', value: <strong className="mk-num">{formatVnd(d.held)}</strong> },
                { label: 'Đã chuyển người bán', value: <span className="mk-num">{formatVnd(d.paidOut)}</span> },
              ]}
            />
          </section>
          <section className="panel panel--wide">
            <h2 className="detail-heading">Lịch sử</h2>
            <KeyValue rows={d.history.map((h) => ({ label: h.at, value: h.label }))} />
          </section>
        </div>
        <aside className={styles.actionBox} aria-labelledby="dd-heading">
          <h2 id="dd-heading" className="card-title-text">
            Quyết định
          </h2>
          {d.decision ? (
            <p>
              {d.decision.kind} <strong className="mk-num">{formatVnd(d.decision.amount)}</strong> · {d.decision.at}. {d.decision.note}
            </p>
          ) : (
            <form
              className="stack"
              onSubmit={async (e) => {
                e.preventDefault();
                if (tooMuch || !note.trim()) return;
                await decideDispute(d.id, kind, value, note.trim());
                onChanged();
              }}
            >
              <fieldset className="stack">
                <legend className="mk-sr">Hình thức</legend>
                {KINDS.map((k) => (
                  <label key={k} className="check">
                    <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} /> {k}
                  </label>
                ))}
              </fieldset>
              {kind === 'Hoàn một phần' && (
                <div className={`mk-field${tooMuch ? ' mk-field--error' : ''}`}>
                  <label htmlFor="refund">Số hoàn cho người mua</label>
                  <input id="refund" inputMode="numeric" value={amount} onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)} />
                  <span className="mk-hint">Tối đa {formatVnd(max)} (số Moonkage đang giữ).</span>
                </div>
              )}
              {tooMuch && <p className="error-text">Không thể hoàn quá số đang giữ.</p>}
              <div className="mk-field">
                <label htmlFor="dnote">Lý do (cả hai bên sẽ đọc)</label>
                <textarea id="dnote" className={styles.textarea} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <KeyValue
                rows={[
                  { label: 'Hoàn người mua', value: <span className="mk-num">{formatVnd(value)}</span> },
                  { label: 'Chuyển người bán', value: <span className="mk-num">{formatVnd(Math.max(0, d.held - value))}</span> },
                ]}
              />
              <button type="submit" className="mk-btn mk-btn--primary mk-btn--block" disabled={tooMuch || !note.trim()}>
                Chốt quyết định
              </button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
