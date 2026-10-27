import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { EmptyState, ErrorState, FileDrop, KeyValue, LoadingState, PageHeader, StatusBadge, Tabs } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { tierPrice } from '../model/sellerModel';
import { declineRequest, sendQuote, useIncomingRequests, withdrawQuote, type CustomTerms, type IncomingRequest } from '../model/useSeller';
import styles from './SellerRequests.module.css';

const timeLeft = (h: number) => (h <= 0 ? 'Hết hạn' : h < 24 ? `Còn ${h} giờ` : `Còn ${Math.round(h / 24)} ngày`);

/** B3.0 */
export function SellerRequestList() {
  const state = useIncomingRequests();
  const [tab, setTab] = useState<'new' | 'quoted' | 'closed'>('new');
  if (state.kind === 'loading') return <LoadingState />;
  if (state.kind === 'error') return <ErrorState message={state.message} onRetry={state.reload} />;
  const list = state.data.filter((r) => (tab === 'closed' ? r.state === 'declined' || r.state === 'closed' : r.state === tab));
  return (
    <div className="page">
      <PageHeader title="Yêu cầu báo giá" />
      <Tabs
        label="Trạng thái"
        current={tab}
        onChange={setTab}
        tabs={[
          { key: 'new', label: 'Mới', count: state.data.filter((r) => r.state === 'new').length },
          { key: 'quoted', label: 'Đã báo giá' },
          { key: 'closed', label: 'Đã đóng' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState title="Không có yêu cầu nào ở đây" />
      ) : (
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">Yêu cầu</th>
              <th scope="col">Loại</th>
              <th scope="col">Người mua · giao tới</th>
              <th scope="col">Hạn trả lời</th>
              <th scope="col">
                <span className="mk-sr">Thao tác</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>
                    {r.id} · {r.boxes} hộp
                  </strong>
                  <br />
                  <span className="muted">{r.summary}</span>
                </td>
                <td>{r.invitation === 'open' ? 'Lời mời' : 'Gửi riêng cho bạn'}</td>
                <td>
                  {r.buyer}
                  <br />
                  <span className="muted">
                    {r.deliverTo} · trước {r.deliverBy}
                  </span>
                </td>
                <td>
                  <StatusBadge tone={r.hoursLeft > 0 && r.hoursLeft < 24 ? 'warn' : 'plain'}>{r.state === 'quoted' ? 'Đã gửi báo giá' : timeLeft(r.hoursLeft)}</StatusBadge>
                </td>
                <td className={styles.actions}>
                  <div className="row">
                    <Link to={routes.sellerRequest(r.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                      Xem
                    </Link>
                    {r.state === 'new' && (
                      <Link to={routes.sellerQuote(r.id)} className="mk-btn mk-btn--primary mk-btn--sm">
                        Báo giá
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const DECLINE = ['Không kịp hạn giao', 'Không làm được kiểu hộp này', 'Khác'];

/** B3.1 */
export function SellerRequestDetail({ request, onChanged }: { request: IncomingRequest; onChanged: () => void }) {
  const [reason, setReason] = useState(DECLINE[0]);
  const run = async (fn: () => Promise<unknown>) => {
    await fn();
    onChanged();
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow={request.invitation === 'open' ? 'Lời mời · gửi nhiều nơi' : 'Gửi riêng cho bạn'}
        title={
          <>
            Yêu cầu {request.id} <StatusBadge tone={request.hoursLeft < 24 ? 'warn' : 'plain'}>{timeLeft(request.hoursLeft)}</StatusBadge>
          </>
        }
        lead={`${request.buyer}${request.buyerVerified ? ' · người đặt đã xác minh danh tính' : ''}`}
      />
      <div className={styles.detailLayout}>
        <div className="stack">
          <section className="panel panel--wide" aria-labelledby="needs-heading">
            <h2 id="needs-heading" className="detail-heading">
              Người mua cần
            </h2>
            <KeyValue
              rows={[
                { label: 'Số hộp', value: `${request.boxes} hộp × ${request.perBox}` },
                { label: 'Làm riêng / vỏ / nhân', value: request.summary },
                { label: 'Giao', value: `${request.deliverTo} · trước ${request.deliverBy}` },
                ...(request.note ? [{ label: 'Ghi chú', value: request.note }] : []),
              ]}
            />
          </section>
          {request.files.length > 0 && (
            <section className="panel panel--wide" aria-labelledby="files-heading">
              <h2 id="files-heading" className="detail-heading">
                Tệp người mua gửi
              </h2>
              {request.files.map((f) => (
                <p key={f}>
                  <span className="mk-badge">PDF</span> {f}
                </p>
              ))}
            </section>
          )}
          {request.quote && (
            <section className="panel panel--wide" aria-labelledby="my-quote">
              <h2 id="my-quote" className="detail-heading">
                Báo giá bạn đã gửi
              </h2>
              <KeyValue
                rows={[
                  { label: 'Tổng', value: formatVnd(request.quote.unitPrice * request.boxes) },
                  { label: 'Đặt cọc', value: `${request.quote.depositPercent}%` },
                  { label: 'Giao trước', value: request.quote.deliverBy },
                  { label: 'Hiệu lực tới', value: request.quote.validUntil },
                ]}
              />
            </section>
          )}
        </div>
        <aside className={styles.actionBox} aria-labelledby="reply-heading">
          <h2 id="reply-heading" className="card-title-text">
            Phản hồi
          </h2>
          {request.state === 'new' && (
            <>
              <Link to={routes.sellerQuote(request.id)} className="mk-btn mk-btn--primary mk-btn--block">
                Soạn báo giá
              </Link>
              <div className="mk-field">
                <label htmlFor="decline">Từ chối yêu cầu</label>
                <select id="decline" value={reason} onChange={(e) => setReason(e.target.value)}>
                  {DECLINE.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" onClick={() => run(() => declineRequest(request.id, reason))}>
                Từ chối
              </button>
            </>
          )}
          {request.state === 'quoted' && (
            <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" onClick={() => run(() => withdrawQuote(request.id))}>
              Thu hồi báo giá
            </button>
          )}
          {request.state === 'declined' && <p className="muted">Bạn đã từ chối yêu cầu này.</p>}
          <p className="muted">Sau khi gửi báo giá, bạn thu hồi được cho tới khi người mua chấp nhận.</p>
        </aside>
      </div>
    </div>
  );
}

/** B3.2: price from the seller's tiers, deposit, dates; the buyer's view updates as they type. */
export function QuoteComposer({ request, terms, onSent, onCancel }: { request: IncomingRequest; terms: CustomTerms; onSent: () => void; onCancel: () => void }) {
  const suggested = tierPrice(terms, request.boxes);
  const [unit, setUnit] = useState(String(suggested ?? ''));
  const [deposit, setDeposit] = useState(50);
  const [deliverBy, setDeliverBy] = useState('2026-11-10');
  const [validUntil, setValidUntil] = useState('2026-10-27');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const price = Number(unit) || 0;
  const total = price * request.boxes;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!price) return setError('Nhập đơn giá mỗi hộp.');
    const dmy = (iso: string) => iso.split('-').reverse().join('/');
    await sendQuote(request.id, { unitPrice: price, depositPercent: deposit, deliverBy: dmy(deliverBy), validUntil: dmy(validUntil), note });
    onSent();
  };

  return (
    <div className="page">
      <PageHeader title={`Báo giá cho ${request.id}`} lead={`${request.boxes} hộp × ${request.perBox} · ${request.summary.toLowerCase()} · giao trước ${request.deliverBy}`} />
      <div className={styles.formLayout}>
        <form className={styles.form} onSubmit={submit} noValidate>
          <fieldset className={styles.formSection}>
            <legend>1. Giá</legend>
            <div className={styles.fieldRow}>
              <div className={`mk-field${error ? ' mk-field--error' : ''}`}>
                <label htmlFor="unit">Đơn giá mỗi hộp (đ)</label>
                <input id="unit" className="mk-num" inputMode="numeric" value={unit} onChange={(e) => setUnit(e.target.value.replace(/\D/g, ''))} aria-invalid={error ? true : undefined} aria-describedby="unit-hint" />
                <span className="mk-hint" id="unit-hint">
                  {error ?? (suggested ? `Gợi ý theo bậc giá của bạn: ${formatVnd(suggested)}` : 'Số hộp ngoài bậc giá của bạn')}
                </span>
              </div>
              <div className="mk-field">
                <label htmlFor="deposit">Đặt cọc</label>
                <select id="deposit" value={deposit} onChange={(e) => setDeposit(Number(e.target.value))}>
                  <option value={50}>50%</option>
                  <option value={30}>30%</option>
                </select>
              </div>
            </div>
          </fieldset>
          <fieldset className={styles.formSection}>
            <legend>2. Làm và giao</legend>
            <div className={styles.fieldRow}>
              <div className="mk-field">
                <label htmlFor="by">Giao trước ngày</label>
                <input id="by" type="date" value={deliverBy} onChange={(e) => setDeliverBy(e.target.value)} />
              </div>
              <div className="mk-field">
                <label htmlFor="valid">Báo giá hiệu lực tới</label>
                <input id="valid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            </div>
            <FileDrop label="Maket mẫu (không bắt buộc)" hint="PDF, PNG" accept=".pdf,image/*" />
            <div className="mk-field">
              <label htmlFor="qnote">Ghi chú cho người mua</label>
              <textarea id="qnote" className={styles.textarea} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Khắc laser logo trên nắp gỗ, gửi maket trong 24 giờ sau khi nhận cọc." />
            </div>
          </fieldset>
          <div className={styles.formActions}>
            <button type="button" className="mk-btn mk-btn--quiet" onClick={onCancel}>
              Hủy
            </button>
            <button type="submit" className="mk-btn mk-btn--primary">
              Gửi báo giá
            </button>
          </div>
        </form>
        <aside className={styles.sideNote} aria-labelledby="buyer-sees">
          <h2 id="buyer-sees" className="card-title-text">
            Người mua sẽ thấy
          </h2>
          <ul className={styles.lines}>
            <li className={styles.lineRow}>
              <span className="mk-num">
                {request.boxes} × {formatVnd(price)}
              </span>
              <span />
              <span className="mk-num">{formatVnd(total)}</span>
            </li>
            <li className={`${styles.lineRow} ${styles.lineTotal}`}>
              <span>Tổng</span>
              <span />
              <span className="mk-num">{formatVnd(total)}</span>
            </li>
            <li className={styles.lineRow}>
              <span>Cọc {deposit}%</span>
              <span />
              <span className="mk-num">{formatVnd(Math.round((total * deposit) / 100))}</span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
