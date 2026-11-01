import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { customStepLabel, goods, nextCustomStep, orderStatusLabel, type VendorCustomOrder, type VendorReadyOrder } from '@/entities/order';
import { routes } from '@/shared/config/routes';
import { useAction } from '@/shared/lib';
import { FileDrop, KeyValue, PageHeader, SectionTabs, StatusBadge, Steps } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { advanceCustomOrder, attachInvoice, confirmOrder, markDelivered, proposeResolution, sendMockup, shipOrder } from '../api/fulfillOrderApi';
import styles from './VendorOrderDetail.module.css';

const PROPOSALS = ['Hoàn một phần', 'Hoàn toàn bộ', 'Không hoàn, kèm lý do'];
/** Shown while the ledger is not read here. */
const UNKNOWN_AMOUNT = '—';

/** Runs one change of the order, then reloads it; keeps the server's message when it refuses. */
function useOrderAction(onChanged: () => void) {
  const action = useAction();
  const { busy, error } = action;
  const run = async (fn: () => Promise<unknown>) => {
    const ok = await action.run(fn);
    if (ok) onChanged();
    return ok;
  };
  const errorView = error && (
    <p className="error-text" role="alert">
      {error}
    </p>
  );
  return { busy, run, errorView };
}

/** Invoice upload (FR-44): pick the file, then attach it. */
function InvoiceAttach({ busy, onAttach }: { busy: boolean; onAttach: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <div className="stack">
      <FileDrop label="Hóa đơn đã xuất" hint="PDF, PNG" accept=".pdf,image/*" onSelect={(files) => setFile(files[0] ?? null)} />
      <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" disabled={!file || busy} onClick={() => file && onAttach(file)}>
        Gắn hóa đơn
      </button>
    </div>
  );
}

/** B2.1: a shop order. New → confirm → (tracking code when inter-province) → delivered; complaint response. */
export function VendorReadyOrderView({ order, onChanged }: { order: VendorReadyOrder; onChanged: () => void }) {
  const [tracking, setTracking] = useState('');
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [proposal, setProposal] = useState(PROPOSALS[0]);
  const [amount, setAmount] = useState('210000');
  const [note, setNote] = useState('');
  const [evidence, setEvidence] = useState<File | null>(null);
  const status = orderStatusLabel[order.status];
  const { busy, run, errorView } = useOrderAction(onChanged);

  const ship = (e: FormEvent) => {
    e.preventDefault();
    if (order.interProvince && !tracking.trim()) return setTrackingError('Giao liên tỉnh cần mã vận đơn.');
    void run(() => shipOrder(order.id, tracking.trim()));
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Đơn Shop"
        title={
          <>
            Đơn {order.id} <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            {order.complaint && <StatusBadge tone="warn">Đang khiếu nại</StatusBadge>}
          </>
        }
        lead={`${order.buyer} · ${order.deliverTo} · đặt ${order.placedAt}`}
      />
      <div className={styles.detailLayout}>
        <div className="stack">
          {order.complaint && (
            <section className="panel panel--wide" aria-labelledby="complaint-heading">
              <div className="row-between">
                <h2 id="complaint-heading" className="detail-heading">
                  Khiếu nại của người mua
                </h2>
                {order.complaint.daysLeft !== undefined && <StatusBadge tone="warn">{`Còn ${order.complaint.daysLeft} ngày để phản hồi`}</StatusBadge>}
              </div>
              <p>
                {order.complaint.reason} <span className="muted">"{order.complaint.description}"</span>
              </p>
              {order.complaint.photoUrls?.length ? (
                <div className="row">
                  {order.complaint.photoUrls.map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className={`${styles.mockupFrame} ${styles.complaintPhoto}`}>
                      Ảnh người mua {i + 1}
                    </a>
                  ))}
                </div>
              ) : (
                <div className={`${styles.mockupFrame} ${styles.complaintPhoto}`}>Ảnh người mua</div>
              )}
              {order.complaint.proposal ? (
                <p className="notice">
                  Bạn đã đề xuất: {order.complaint.proposal.kind}
                  {order.complaint.proposal.amount ? ` ${formatVnd(order.complaint.proposal.amount)}` : ''}. Quản trị ra quyết định cuối cùng.
                </p>
              ) : order.complaint.replies?.length ? (
                <div className="notice">
                  {order.complaint.replies.map((r) => (
                    <p key={`${r.at}-${r.note}`}>
                      Bạn đã phản hồi {r.at}: {r.note}
                    </p>
                  ))}
                  <p>Quản trị ra quyết định cuối cùng.</p>
                </div>
              ) : (
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!evidence) return;
                    void run(() => proposeResolution(order.id, { kind: proposal, amount: proposal === PROPOSALS[2] ? 0 : Number(amount) || 0, note }, evidence));
                  }}
                >
                  <div className={styles.fieldRow}>
                    <div className="mk-field">
                      <label htmlFor="proposal">Đề xuất của bạn</label>
                      <select id="proposal" value={proposal} onChange={(e) => setProposal(e.target.value)}>
                        {PROPOSALS.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    {proposal === PROPOSALS[0] && (
                      <div className="mk-field">
                        <label htmlFor="amount">Số tiền đề xuất hoàn (đ)</label>
                        <input id="amount" className="mk-num" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />
                      </div>
                    )}
                  </div>
                  <div className="mk-field">
                    <label htmlFor="proposal-note">Giải thích cho quản trị</label>
                    <textarea id="proposal-note" className={styles.textarea} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Đồng ý 1 bánh bị dập do vận chuyển." />
                  </div>
                  <FileDrop label="Ảnh hoặc tệp bằng chứng của bạn" hint="PNG, JPG, PDF" accept=".pdf,image/*" onSelect={(files) => setEvidence(files[0] ?? null)} />
                  <div className="row-between">
                    <span className="muted">Quản trị ra quyết định cuối cùng. Tiền đơn đang được giữ.</span>
                    <button type="submit" className="mk-btn mk-btn--primary" disabled={!evidence || busy}>
                      Gửi đề xuất cho Moonkage
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}
          <section className="panel panel--wide" aria-labelledby="items-heading">
            <h2 id="items-heading" className="detail-heading">
              Món trong đơn
            </h2>
            <ul className={styles.lines}>
              {order.lines.map((l) => (
                <li key={l.name} className={styles.lineRow}>
                  <span>
                    {l.name} × {l.quantity}
                  </span>
                  <span />
                  <span className="mk-num">{formatVnd(l.price * l.quantity)}</span>
                </li>
              ))}
              <li className={`${styles.lineRow} ${styles.lineSub}`}>
                <span>{order.interProvince ? 'Phí giao liên tỉnh' : 'Phí giao'}</span>
                <span />
                <span className="mk-num">{formatVnd(order.shippingFee)}</span>
              </li>
              <li className={`${styles.lineRow} ${styles.lineTotal}`}>
                <span>Tiền hàng</span>
                <span />
                <span className="mk-num">{formatVnd(goods(order))}</span>
              </li>
            </ul>
          </section>
          <section className="stack" aria-labelledby="hist-heading">
            <h2 id="hist-heading" className="detail-heading">
              Lịch sử
            </h2>
            <KeyValue rows={order.history.map((h) => ({ label: h.at, value: h.label }))} />
          </section>
        </div>
        <aside className={styles.actionBox} aria-labelledby="handle-heading">
          <h2 id="handle-heading" className="card-title-text">
            Xử lý đơn
          </h2>
          {order.status === 'new' && (
            <button type="button" className="mk-btn mk-btn--primary mk-btn--block" disabled={busy} onClick={() => run(() => confirmOrder(order.id))}>
              Xác nhận đơn
            </button>
          )}
          {order.status === 'confirmed' && (
            <form className="stack" onSubmit={ship}>
              <div className={`mk-field${trackingError ? ' mk-field--error' : ''}`}>
                <label htmlFor="tracking">Mã vận đơn{order.interProvince ? '' : ' (không bắt buộc)'}</label>
                <input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} aria-invalid={trackingError ? true : undefined} aria-describedby="tracking-hint" />
                <span className="mk-hint" id="tracking-hint">
                  {trackingError ?? (order.interProvince ? 'Bắt buộc khi giao liên tỉnh.' : 'Giao nội tỉnh có thể bỏ trống.')}
                </span>
              </div>
              <button type="submit" className="mk-btn mk-btn--primary mk-btn--block" disabled={busy}>
                Đã giao cho vận chuyển
              </button>
            </form>
          )}
          {order.status === 'shipping' && (
            <button type="button" className="mk-btn mk-btn--primary mk-btn--block" disabled={busy} onClick={() => run(() => markDelivered(order.id))}>
              Đánh dấu đã giao
            </button>
          )}
          {errorView}
          <KeyValue
            rows={[
              { label: 'Giao', value: order.deliveredAt ? `Đã giao ${order.deliveredAt}` : order.tracking ? `Mã ${order.tracking}` : 'Chưa giao' },
              { label: 'Hóa đơn', value: order.invoiceAttached ? 'Đã gắn' : 'Chưa có' },
            ]}
          />
          {!order.invoiceAttached && <InvoiceAttach busy={busy} onAttach={(file) => void run(() => attachInvoice(order.id, file))} />}
          <p className="muted">Đơn mới: Xác nhận → nhập mã vận đơn (liên tỉnh) → Đã giao.</p>
        </aside>
      </div>
    </div>
  );
}

const CUSTOM_STEPS = ['Nhận cọc', 'Maket', 'Sản xuất', 'Giao hàng', 'Người mua trả phần còn lại'];
const stepIndex = { mockup: 1, production: 2, delivery: 3, remaining: 4, done: 5 } as const;
type Tab = 'mockup' | 'progress' | 'money' | 'invoice';

/** B2.2: a custom order. Mockups, progress updates, deposit held and disbursed, invoice. */
export function VendorCustomOrderView({ order, onChanged }: { order: VendorCustomOrder; onChanged: () => void }) {
  const [tab, setTab] = useState<Tab>('mockup');
  const [update, setUpdate] = useState('');
  const [mockupFile, setMockupFile] = useState<File | null>(null);
  const { busy, run, errorView } = useOrderAction(onChanged);
  const nextMockup = order.mockupsSent + 1;
  const next = nextCustomStep[order.step];
  const status =
    order.step !== 'mockup'
      ? { tone: 'soft' as const, label: customStepLabel[order.step] }
      : order.feedback
        ? { tone: 'warn' as const, label: 'Sửa maket theo góp ý' }
        : order.mockupsSent === 0
          ? { tone: 'warn' as const, label: 'Chờ bạn gửi maket' }
          : { tone: 'soft' as const, label: order.mockupApproved ? 'Maket đã duyệt' : 'Chờ người mua duyệt maket' };
  const amountOf = (n: number | null) => (n === null ? UNKNOWN_AMOUNT : formatVnd(n));
  return (
    <div className="page">
      <PageHeader
        eyebrow="Đơn đặt hàng"
        title={
          <>
            Đơn {order.id} <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </>
        }
        lead={`${order.buyer} · ${order.title} · giao trước ${order.deliverBy}`}
      />
      <Steps label="Tiến độ đơn" steps={CUSTOM_STEPS} current={stepIndex[order.step]} />
      <div className={styles.detailLayout}>
        <SectionTabs
          current={tab}
          onChange={setTab}
          tabs={[
            { key: 'mockup', label: `Maket ${order.mockupsSent}` },
            { key: 'progress', label: 'Tiến độ' },
            { key: 'money', label: 'Giải ngân' },
            { key: 'invoice', label: 'Hóa đơn' },
          ]}
        >
          {tab === 'mockup' && (
            <div className="stack">
              {order.feedback && (
                <p className="notice">
                  Góp ý của người mua: "{order.feedback.text}" · {order.feedback.at}
                </p>
              )}
              {order.mockupsSent > 0 && (
                <div className={styles.mockup}>
                  <div className={styles.mockupFrame}>
                    {order.latestMockupUrl ? (
                      <a href={order.latestMockupUrl} target="_blank" rel="noreferrer">
                        Mở maket lần {order.mockupsSent}
                      </a>
                    ) : (
                      <>Maket lần {order.mockupsSent}</>
                    )}
                  </div>
                  <p className="muted">Maket lần {order.mockupsSent} (đã gửi)</p>
                </div>
              )}
              {order.step === 'mockup' && !order.mockupApproved && (
                <>
                  <FileDrop label={`Tải maket lần ${nextMockup}`} hint="PDF, PNG" accept=".pdf,image/*" onSelect={(files) => setMockupFile(files[0] ?? null)} />
                  <button
                    type="button"
                    className="mk-btn mk-btn--primary"
                    disabled={!mockupFile || busy}
                    onClick={() => mockupFile && void run(() => sendMockup(order.id, mockupFile)).then((ok) => ok && setMockupFile(null))}
                  >
                    Gửi maket lần {nextMockup}
                  </button>
                </>
              )}
            </div>
          )}
          {tab === 'progress' && (
            <div className="stack">
              <KeyValue rows={order.progress.map((p) => ({ label: p.at, value: p.label }))} />
              {next && (
                <form
                  className="row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(() => advanceCustomOrder(order.id, next, customStepLabel[next], update.trim())).then((ok) => ok && setUpdate(''));
                  }}
                >
                  <div className="mk-field grow">
                    <label htmlFor="update">Ghi chú cho người mua (không bắt buộc)</label>
                    <input id="update" value={update} onChange={(e) => setUpdate(e.target.value)} placeholder="Đã mua nguyên liệu, bắt đầu nướng" />
                  </div>
                  <button type="submit" className="mk-btn mk-btn--quiet" disabled={busy}>
                    Chuyển sang: {customStepLabel[next]}
                  </button>
                </form>
              )}
            </div>
          )}
          {tab === 'money' && (
            <div className="stack">
              <KeyValue
                rows={[
                  { label: 'Đang giữ (cọc)', value: amountOf(order.held) },
                  { label: 'Đã giải ngân', value: amountOf(order.disbursed) },
                ]}
              />
              <Link to={routes.vendor.disbursements} className="mk-btn mk-btn--quiet">
                Tạo yêu cầu giải ngân
              </Link>
            </div>
          )}
          {tab === 'invoice' &&
            (order.invoiceAttached ? (
              <p>Đã gắn hóa đơn.</p>
            ) : (
              <InvoiceAttach busy={busy} onAttach={(file) => void run(() => attachInvoice(order.id, file))} />
            ))}
        </SectionTabs>
        <aside className={styles.actionBox} aria-labelledby="now-heading">
          <h2 id="now-heading" className="card-title-text">
            Việc của bạn bây giờ
          </h2>
          <p>
            {order.step !== 'mockup'
              ? next
                ? `Khi xong bước hiện tại, chuyển sang "${customStepLabel[next]}" ở thẻ Tiến độ.`
                : 'Chờ người mua trả phần còn lại.'
              : order.feedback
                ? `Gửi maket lần ${nextMockup} theo góp ý. Sản xuất bắt đầu khi người mua duyệt.`
                : order.mockupApproved
                  ? 'Người mua đã duyệt maket. Chuyển sang "Sản xuất" ở thẻ Tiến độ.'
                  : order.mockupsSent === 0
                    ? 'Gửi maket lần 1 cho người mua duyệt.'
                    : 'Chờ người mua duyệt maket. Bạn nhận thông báo khi có kết quả.'}
          </p>
          {order.step === 'mockup' && !order.mockupApproved && (order.feedback || order.mockupsSent === 0) && (
            <button type="button" className="mk-btn mk-btn--primary mk-btn--block" onClick={() => setTab('mockup')}>
              Gửi maket mới
            </button>
          )}
          {errorView}
          <KeyValue
            rows={[
              { label: 'Giá trị', value: formatVnd(order.value) },
              { label: 'Đang giữ', value: amountOf(order.held) },
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
