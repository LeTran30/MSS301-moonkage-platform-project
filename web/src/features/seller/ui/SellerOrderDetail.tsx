import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../../shared/config/routes';
import { FileDrop, KeyValue, PageHeader, SectionTabs, StatusBadge, Steps } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { addProgress, attachInvoice, confirmOrder, markDelivered, proposeResolution, sendMockup, shipOrder } from '../api/sellerApi';
import type { SellerCustomOrder, SellerReadyOrder } from '../api/types';
import { goods, orderStatusLabel } from '../model/sellerModel';

const PROPOSALS = ['Hoàn một phần', 'Hoàn toàn bộ', 'Không hoàn, kèm lý do'];

/** B2.1: a shop order. New → confirm → (tracking code when inter-province) → delivered; complaint response. */
export function SellerReadyOrderView({ order, onChanged }: { order: SellerReadyOrder; onChanged: () => void }) {
  const [tracking, setTracking] = useState('');
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [proposal, setProposal] = useState(PROPOSALS[0]);
  const [amount, setAmount] = useState('210000');
  const [note, setNote] = useState('');
  const status = orderStatusLabel[order.status];
  const run = async (fn: () => Promise<unknown>) => {
    await fn();
    onChanged();
  };

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
      <div className="detail-layout">
        <div className="stack">
          {order.complaint && (
            <section className="panel panel--wide" aria-labelledby="complaint-heading">
              <div className="row-between">
                <h2 id="complaint-heading" className="detail-heading">
                  Khiếu nại của người mua
                </h2>
                <StatusBadge tone="warn">{`Còn ${order.complaint.daysLeft} ngày để phản hồi`}</StatusBadge>
              </div>
              <p>
                {order.complaint.reason} <span className="muted">"{order.complaint.description}"</span>
              </p>
              <div className="mockup__frame complaint-photo">Ảnh người mua</div>
              {order.complaint.proposal ? (
                <p className="notice">
                  Bạn đã đề xuất: {order.complaint.proposal.kind}
                  {order.complaint.proposal.amount ? ` ${formatVnd(order.complaint.proposal.amount)}` : ''}. Quản trị ra quyết định cuối cùng.
                </p>
              ) : (
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(() => proposeResolution(order.id, { kind: proposal, amount: proposal === PROPOSALS[2] ? 0 : Number(amount) || 0, note }));
                  }}
                >
                  <div className="field-row">
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
                    <textarea id="proposal-note" className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Đồng ý 1 bánh bị dập do vận chuyển." />
                  </div>
                  <div className="row-between">
                    <span className="muted">Quản trị ra quyết định cuối cùng. Tiền đơn đang được giữ.</span>
                    <button type="submit" className="mk-btn mk-btn--primary">
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
            <ul className="lines">
              {order.lines.map((l) => (
                <li key={l.name} className="lines__row">
                  <span>
                    {l.name} × {l.quantity}
                  </span>
                  <span />
                  <span className="mk-num">{formatVnd(l.price * l.quantity)}</span>
                </li>
              ))}
              <li className="lines__row lines__row--sub">
                <span>{order.interProvince ? 'Phí giao liên tỉnh' : 'Phí giao'}</span>
                <span />
                <span className="mk-num">{formatVnd(order.shippingFee)}</span>
              </li>
              <li className="lines__row lines__row--total">
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
        <aside className="action-box" aria-labelledby="handle-heading">
          <h2 id="handle-heading" className="card-title-text">
            Xử lý đơn
          </h2>
          {order.status === 'new' && (
            <button type="button" className="mk-btn mk-btn--primary mk-btn--block" onClick={() => run(() => confirmOrder(order.id))}>
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
              <button type="submit" className="mk-btn mk-btn--primary mk-btn--block">
                Đã giao cho vận chuyển
              </button>
            </form>
          )}
          {order.status === 'shipping' && (
            <button type="button" className="mk-btn mk-btn--primary mk-btn--block" onClick={() => run(() => markDelivered(order.id))}>
              Đánh dấu đã giao
            </button>
          )}
          <KeyValue
            rows={[
              { label: 'Giao', value: order.deliveredAt ? `Đã giao ${order.deliveredAt}` : order.tracking ? `Mã ${order.tracking}` : 'Chưa giao' },
              { label: 'Hóa đơn', value: order.invoiceAttached ? 'Đã gắn' : 'Chưa có' },
            ]}
          />
          {!order.invoiceAttached && (
            <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" onClick={() => run(() => attachInvoice(order.id))}>
              Gắn hóa đơn
            </button>
          )}
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
export function SellerCustomOrderView({ order, onChanged }: { order: SellerCustomOrder; onChanged: () => void }) {
  const [tab, setTab] = useState<Tab>('mockup');
  const [update, setUpdate] = useState('');
  const run = async (fn: () => Promise<unknown>) => {
    await fn();
    onChanged();
  };
  const nextMockup = order.mockupsSent + 1;
  return (
    <div className="page">
      <PageHeader
        eyebrow="Đơn đặt hàng"
        title={
          <>
            Đơn {order.id} <StatusBadge tone={order.feedback ? 'warn' : 'soft'}>{order.feedback ? 'Sửa maket theo góp ý' : 'Chờ người mua duyệt maket'}</StatusBadge>
          </>
        }
        lead={`${order.buyer} · ${order.title} · giao trước ${order.deliverBy}`}
      />
      <Steps label="Tiến độ đơn" steps={CUSTOM_STEPS} current={stepIndex[order.step]} />
      <div className="detail-layout">
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
              <div className="mockup">
                <div className="mockup__frame">Maket lần {order.mockupsSent}</div>
                <p className="muted">Maket lần {order.mockupsSent} (đã gửi)</p>
              </div>
              <FileDrop label={`Tải maket lần ${nextMockup}`} hint="PDF, PNG" accept=".pdf,image/*" />
              <button type="button" className="mk-btn mk-btn--primary" onClick={() => run(() => sendMockup(order.id))}>
                Gửi maket lần {nextMockup}
              </button>
            </div>
          )}
          {tab === 'progress' && (
            <div className="stack">
              <KeyValue rows={order.progress.map((p) => ({ label: p.at, value: p.label }))} />
              <form
                className="row"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (update.trim()) void run(() => addProgress(order.id, update.trim())).then(() => setUpdate(''));
                }}
              >
                <div className="mk-field grow">
                  <label htmlFor="update">Cập nhật sản xuất</label>
                  <input id="update" value={update} onChange={(e) => setUpdate(e.target.value)} placeholder="Đã mua nguyên liệu, bắt đầu nướng" />
                </div>
                <button type="submit" className="mk-btn mk-btn--quiet">
                  + Cập nhật tiến độ
                </button>
              </form>
            </div>
          )}
          {tab === 'money' && (
            <div className="stack">
              <KeyValue
                rows={[
                  { label: 'Đang giữ (cọc)', value: formatVnd(order.held) },
                  { label: 'Đã giải ngân', value: formatVnd(order.disbursed) },
                ]}
              />
              <Link to={routes.sellerDisbursements} className="mk-btn mk-btn--quiet">
                Tạo yêu cầu giải ngân
              </Link>
            </div>
          )}
          {tab === 'invoice' &&
            (order.invoiceAttached ? (
              <p>Đã gắn hóa đơn.</p>
            ) : (
              <button type="button" className="mk-btn mk-btn--quiet" onClick={() => run(() => attachInvoice(order.id))}>
                Gắn hóa đơn
              </button>
            ))}
        </SectionTabs>
        <aside className="action-box" aria-labelledby="now-heading">
          <h2 id="now-heading" className="card-title-text">
            Việc của bạn bây giờ
          </h2>
          <p>
            {order.feedback
              ? `Gửi maket lần ${nextMockup} theo góp ý. Sản xuất bắt đầu khi người mua duyệt.`
              : 'Chờ người mua duyệt maket. Bạn nhận thông báo khi có kết quả.'}
          </p>
          {order.feedback && (
            <button type="button" className="mk-btn mk-btn--primary mk-btn--block" onClick={() => setTab('mockup')}>
              Gửi maket mới
            </button>
          )}
          <KeyValue
            rows={[
              { label: 'Giá trị', value: formatVnd(order.value) },
              { label: 'Đang giữ', value: formatVnd(order.held) },
            ]}
          />
        </aside>
      </div>
    </div>
  );
}
