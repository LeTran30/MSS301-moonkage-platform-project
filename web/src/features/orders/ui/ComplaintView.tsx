import { useState, type FormEvent } from 'react';
import { FileDrop, KeyValue, PageHeader, StatusBadge } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { sendComplaint } from '../api/ordersApi';
import type { Complaint, ReadyOrder } from '../api/types';
import { complaintDaysLeft } from '../model/orderModel';

const REASONS = ['Hộp hoặc bánh bị hỏng khi nhận', 'Thiếu hoặc sai so với đơn', 'Bánh không đảm bảo chất lượng', 'Khác'];

/** M6.1.3: report a problem (form) or follow one already sent (events, decision). */
export function ComplaintView({
  order,
  complaint,
  onSent,
  onCancel,
}: {
  order: ReadyOrder;
  complaint: Complaint | null;
  onSent: () => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const daysLeft = complaintDaysLeft(order);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return setError('Mô tả vấn đề để người bán và quản trị hiểu chuyện gì đã xảy ra.');
    setBusy(true);
    await sendComplaint(order.id, order.shop, reason, description.trim(), 1);
    onSent();
  };

  return (
    <div className="page page--narrow">
      <PageHeader
        title={`Báo vấn đề với đơn ${order.id}`}
        lead={`${order.shop} · giao ${order.deliveredAt ?? '—'}${daysLeft !== null && daysLeft > 0 && !complaint ? ` · còn ${daysLeft} ngày để báo` : ''}`}
      />
      {complaint ? (
        <div className="stack">
          {complaint.decision ? (
            <section className="panel panel--wide decision" aria-labelledby="decision-heading">
              <span className="eyebrow">Quyết định · {complaint.decision.at}</span>
              <h2 id="decision-heading" className="detail-heading">
                {complaint.decision.title}: {formatVnd(complaint.decision.amount)}
              </h2>
              <p>{complaint.decision.body}</p>
            </section>
          ) : (
            <p className="notice">
              <StatusBadge tone="soft">Đang xử lý</StatusBadge> Moonkage đang giữ tiền đơn này. Người bán sẽ đề xuất cách xử lý.
            </p>
          )}
          <section aria-labelledby="events-heading" className="stack">
            <h2 id="events-heading" className="detail-heading">
              Diễn biến
            </h2>
            <KeyValue rows={complaint.events.map((ev) => ({ label: ev.at, value: ev.label }))} />
          </section>
          <section className="panel panel--wide" aria-labelledby="sent-heading">
            <h3 id="sent-heading" className="card-title-text">
              Bạn đã gửi
            </h3>
            <p>{complaint.reason}</p>
            <p className="muted">"{complaint.description}"</p>
          </section>
        </div>
      ) : (
        <div className="form-layout">
          <form className="form" onSubmit={submit} noValidate>
            <fieldset className="form-section">
              <legend>Vấn đề</legend>
              {REASONS.map((r) => (
                <label key={r} className="check">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} /> {r}
                </label>
              ))}
            </fieldset>
            <div className={`mk-field${error ? ' mk-field--error' : ''}`}>
              <label htmlFor="desc">Mô tả</label>
              <textarea
                id="desc"
                className="textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby="desc-hint"
                placeholder="Nắp hộp rách, 1 bánh dập góc."
              />
              <span className="mk-hint" id="desc-hint">
                {error ?? 'Nói rõ hộp nào, bánh nào và tình trạng khi nhận.'}
              </span>
            </div>
            <FileDrop label="Ảnh bằng chứng" hint="PNG, JPG · tối đa 5 ảnh" accept="image/*" multiple />
            <div className="form-actions">
              <button type="button" className="mk-btn mk-btn--quiet" onClick={onCancel}>
                Hủy
              </button>
              <button type="submit" className="mk-btn mk-btn--primary" aria-busy={busy || undefined}>
                Gửi
              </button>
            </div>
          </form>
          <aside className="side-note" aria-label="Sau khi gửi">
            <h2 className="card-title-text">Sau khi gửi</h2>
            <ol className="cond-list">
              <li>Moonkage giữ tiền đơn này</li>
              <li>Người bán xem và đề xuất cách xử lý</li>
              <li>Quản trị quyết định: hoàn toàn bộ, một phần hoặc bác</li>
            </ol>
          </aside>
        </div>
      )}
    </div>
  );
}
