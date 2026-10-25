import { useState } from 'react';
import { KeyValue, PageHeader, SectionTabs, StatusBadge, Steps } from '../../../shared/ui';
import { formatVnd } from '../../../shared/utils/money';
import { approveMockup, requestRevision } from '../api/ordersApi';
import type { CustomOrder } from '../api/types';
import { customStatus, customSteps, depositAmount, remainingAmount, stepIndex } from '../model/orderModel';

type Tab = 'mockup' | 'progress' | 'payment' | 'invoice';

/** M6.1.2: a custom order. The action box says the one thing the buyer has to do now. */
export function CustomOrderView({
  order,
  onChanged,
  onPayRemaining,
}: {
  order: CustomOrder;
  onChanged: () => void;
  onPayRemaining: (order: CustomOrder) => void;
}) {
  const [tab, setTab] = useState<Tab>('mockup');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const status = customStatus(order);
  const latest = order.mockups[0];
  const waitingMockup = order.step === 'mockup' && latest?.state === 'waiting';

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    await fn();
    setBusy(false);
    setFeedback('');
    onChanged();
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Đơn đặt theo yêu cầu"
        title={
          <>
            Đơn {order.id} <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </>
        }
        lead={`${order.supplier} · ${order.title} · từ yêu cầu ${order.requestId}`}
      />
      <Steps label="Tiến độ đơn" steps={customSteps.map((s) => s.label)} current={stepIndex(order.step)} />

      <div className="detail-layout">
        <SectionTabs
          current={tab}
          onChange={setTab}
          tabs={[
            { key: 'mockup', label: `Maket ${order.mockups.length}` },
            { key: 'progress', label: 'Tiến độ' },
            { key: 'payment', label: 'Thanh toán' },
            { key: 'invoice', label: 'Hóa đơn' },
          ]}
        >
          {tab === 'mockup' &&
            (order.mockups.length === 0 ? (
              <p className="muted">Đơn vị gửi maket trong 24 giờ sau khi nhận cọc.</p>
            ) : (
              <ul className="mockups">
                {order.mockups.map((m) => (
                  <li key={m.version} className="mockup">
                    <div className="mockup__frame">Maket lần {m.version}</div>
                    <div className="stack mockup__info">
                      <p className="body-strong-text">
                        Maket lần {m.version}{' '}
                        {m.state === 'approved' && <StatusBadge tone="ok">Đã duyệt</StatusBadge>}
                        {m.state === 'revise' && <StatusBadge tone="muted">Đã yêu cầu sửa</StatusBadge>}
                      </p>
                      <p className="muted">
                        Gửi {m.sentAt} · {m.note}
                      </p>
                      {m.feedback && <p className="notice">Góp ý của bạn: {m.feedback}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          {tab === 'progress' && (
            <KeyValue rows={[...order.progress].reverse().map((p) => ({ label: p.at, value: p.label }))} />
          )}
          {tab === 'payment' && (
            <ul className="lines">
              <li className="lines__row">
                <span>Giá trị đơn</span>
                <span />
                <span className="mk-num">{formatVnd(order.value)}</span>
              </li>
              <li className="lines__row">
                <span>
                  Đã cọc {order.depositPercent}% · {order.depositPaidAt}
                </span>
                <span />
                <span className="mk-num">{formatVnd(depositAmount(order))}</span>
              </li>
              <li className="lines__row lines__row--total">
                <span>{order.step === 'done' ? 'Còn lại · đã trả' : 'Còn lại · trả sau khi giao'}</span>
                <span />
                <span className="mk-num">{formatVnd(remainingAmount(order))}</span>
              </li>
            </ul>
          )}
          {tab === 'invoice' &&
            (order.invoiceAttached ? (
              <button type="button" className="mk-btn mk-btn--quiet">
                Tải hóa đơn
              </button>
            ) : (
              <p className="muted">Chưa có hóa đơn. Đơn vị gắn hóa đơn sau khi giao hàng.</p>
            ))}
        </SectionTabs>

        <aside className="action-box" aria-labelledby="todo-heading">
          <h2 id="todo-heading" className="card-title-text">
            Việc của bạn bây giờ
          </h2>
          {waitingMockup && (
            <>
              <p>Duyệt maket lần {latest.version} để đơn vị bắt đầu sản xuất.</p>
              <button type="button" className="mk-btn mk-btn--primary mk-btn--block" aria-busy={busy || undefined} onClick={() => act(() => approveMockup(order.id))}>
                Duyệt maket
              </button>
              <div className="mk-field">
                <label htmlFor="feedback">Góp ý (nếu yêu cầu sửa)</label>
                <textarea id="feedback" className="textarea" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
              </div>
              <button
                type="button"
                className="mk-btn mk-btn--quiet mk-btn--block"
                disabled={!feedback.trim()}
                onClick={() => act(() => requestRevision(order.id, feedback.trim()))}
              >
                Yêu cầu sửa
              </button>
            </>
          )}
          {order.step === 'mockup' && !waitingMockup && <p className="muted">Chờ đơn vị gửi maket mới. Bạn nhận thông báo khi có.</p>}
          {(order.step === 'production' || order.step === 'delivery') && (
            <p className="muted">Đơn vị đang làm theo maket đã duyệt. Trả phần còn lại sau khi nhận hàng.</p>
          )}
          {order.step === 'remaining' && (
            <>
              <p>
                Đơn đã giao {order.deliveredAt}. Trả phần còn lại {formatVnd(remainingAmount(order))} để hoàn tất đơn.
              </p>
              <button type="button" className="mk-btn mk-btn--primary mk-btn--block" onClick={() => onPayRemaining(order)}>
                Trả phần còn lại {formatVnd(remainingAmount(order))}
              </button>
            </>
          )}
          {order.step === 'done' && <p className="muted">Đơn đã hoàn tất. Cảm ơn bạn.</p>}
        </aside>
      </div>
    </div>
  );
}
