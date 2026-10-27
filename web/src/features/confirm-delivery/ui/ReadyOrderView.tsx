import { useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintDaysLeft, goodsTotal, readyStatusLabel, readyTotal, type ReadyOrder } from '@/entities/order';
import { routes } from '@/shared/config/routes';
import { KeyValue, PageHeader, StatusBadge, Steps } from '@/shared/ui';
import { formatVnd } from '@/shared/utils/money';
import { confirmReceived } from '../api/confirmDeliveryApi';
import styles from './ReadyOrderView.module.css';

const STEPS = ['Đã thanh toán', 'Shop xác nhận', 'Đang giao', 'Đã giao'];
const stepOf = { pending: 0, shipping: 2, delivered: 3, cancelled: 0 } as const;

/** M6.1.1: one ready-made order; "Báo vấn đề với đơn" only while the window is open. */
export function ReadyOrderView({ order, onChanged }: { order: ReadyOrder; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const status = readyStatusLabel[order.status];
  const daysLeft = complaintDaysLeft(order);
  const canComplain = order.complaintId !== undefined || (daysLeft !== null && daysLeft > 0);

  const receive = async () => {
    setBusy(true);
    await confirmReceived(order.id);
    setBusy(false);
    onChanged();
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Đơn hàng có sẵn"
        title={
          <>
            Đơn {order.id} <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </>
        }
        lead={`${order.shop} · đặt ${order.placedAt} · lần thanh toán ${order.paymentId}`}
      />
      {order.status !== 'cancelled' && <Steps label="Tiến độ đơn" steps={STEPS} current={stepOf[order.status]} />}
      {order.tracking && (
        <p className="notice mk-num">
          Mã vận đơn {order.tracking}
          {order.expectedAt ? ` · dự kiến giao ${order.expectedAt}` : ''}
        </p>
      )}

      <div className={`${styles.detailLayout} detail-layout`}>
        <div className="stack">
          <section aria-labelledby="lines-heading" className="panel panel--wide">
            <h2 id="lines-heading" className="detail-heading">
              Sản phẩm
            </h2>
            <ul className={`${styles.lines} lines`}>
              {order.lines.map((l) => (
                <li key={l.name} className={`${styles.linesRow} lines__row`}>
                  <span>{l.name}</span>
                  <span className="muted mk-num">
                    {formatVnd(l.price)} × {l.quantity}
                  </span>
                  <span className="mk-num">{formatVnd(l.price * l.quantity)}</span>
                </li>
              ))}
              <li className={`${styles.linesRow} ${styles.linesRowSub} lines__row lines__row--sub`}>
                <span>Tiền hàng</span>
                <span />
                <span className="mk-num">{formatVnd(goodsTotal(order))}</span>
              </li>
              <li className={`${styles.linesRow} ${styles.linesRowSub} lines__row lines__row--sub`}>
                <span>Phí giao</span>
                <span />
                <span className="mk-num">{formatVnd(order.shippingFee)}</span>
              </li>
              <li className={`${styles.linesRow} ${styles.linesRowTotal} lines__row lines__row--total`}>
                <span>Tổng</span>
                <span />
                <span className="mk-num">{formatVnd(readyTotal(order))}</span>
              </li>
            </ul>
          </section>
          <div className="grid-2">
            <section className="panel" aria-labelledby="to-heading">
              <h3 id="to-heading" className="card-title-text">
                Giao tới
              </h3>
              <p>
                {order.address.name} · {order.address.phone}
                <br />
                {order.address.line}
              </p>
            </section>
            <section className="panel" aria-labelledby="inv-heading">
              <h3 id="inv-heading" className="card-title-text">
                Hóa đơn
              </h3>
              {order.invoice ? (
                <p>
                  {order.invoice.company} · MST {order.invoice.taxCode}
                  <br />
                  <span className="muted">Gửi tới {order.invoice.email}</span>
                </p>
              ) : (
                <p className="muted">Không xuất hóa đơn công ty.</p>
              )}
            </section>
          </div>
          <section aria-labelledby="history-heading" className="stack">
            <h2 id="history-heading" className="detail-heading">
              Lịch sử
            </h2>
            <KeyValue rows={order.history.map((h) => ({ label: h.at, value: h.label }))} />
          </section>
        </div>

        <aside className={`${styles.actionBox} action-box`} aria-labelledby="actions-heading">
          <h2 id="actions-heading" className="card-title-text">
            Bạn có thể
          </h2>
          {order.status === 'shipping' && (
            <button type="button" className="mk-btn mk-btn--primary mk-btn--block" onClick={receive} aria-busy={busy || undefined}>
              Xác nhận đã nhận hàng
            </button>
          )}
          {order.invoice && (
            <button type="button" className="mk-btn mk-btn--quiet mk-btn--block">
              Tải hóa đơn
            </button>
          )}
          <button type="button" className="mk-btn mk-btn--quiet mk-btn--block" disabled={order.status !== 'delivered'}>
            {order.status === 'delivered' ? 'Đánh giá' : 'Đánh giá (sau khi nhận)'}
          </button>
          {canComplain && (
            <Link to={routes.account.orderComplaint(order.id)} className="mk-btn mk-btn--outline mk-btn--block">
              {order.complaintId ? 'Xem báo vấn đề' : 'Báo vấn đề với đơn'}
            </Link>
          )}
          <p className="muted">
            {daysLeft !== null && daysLeft > 0
              ? `Còn ${daysLeft} ngày để báo vấn đề.`
              : `Báo vấn đề được trong ${order.complaintDays} ngày sau khi giao (nội thành).`}
          </p>
        </aside>
      </div>
    </div>
  );
}
