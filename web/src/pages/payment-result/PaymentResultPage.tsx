import { Link, useParams } from 'react-router-dom';
import { CHECKOUT_STEPS } from '../../features/cart';
import { routes } from '../../shared/config/routes';
import { EmptyState, LoadingState, PageHeader, StatusBadge, Steps } from '../../shared/ui';
import { formatVnd } from '../../shared/utils/money';
import { usePaymentFollowUp } from './usePaymentFollowUp';

interface CreatedOrder {
  id: string;
  shop: string;
  total: number;
  lines: { name: string; quantity: number }[];
}

/** M4.3: result of any VNPay payment (checkout, deposit, rest, seller fee). */
export function PaymentResultPage() {
  const { paymentId = '' } = useParams();
  const payment = usePaymentFollowUp(paymentId);

  if (payment === undefined) return <LoadingState label="Đang xác nhận thanh toán với VNPay…" />;
  if (payment === null)
    return (
      <div className="shop__inner page">
        <EmptyState title="Không có giao dịch này" />
      </div>
    );

  const paid = payment.status === 'paid';
  const created = (payment.context.orders as CreatedOrder[] | undefined) ?? [];
  const back =
    payment.purpose === 'checkout'
      ? routes.checkout
      : payment.purpose === 'seller-fee'
        ? routes.sellerFee
        : payment.purpose === 'deposit'
          ? routes.quoteRequest(payment.context.requestId as string)
          : routes.order(payment.context.orderId as string);

  return (
    <div className="shop__inner page page--narrow">
      {payment.purpose === 'checkout' && <Steps label="Các bước thanh toán" steps={CHECKOUT_STEPS} current={3} />}
      <div className={`result-head ${paid ? 'result-head--ok' : 'result-head--fail'}`}>
        <span className="result-head__mark" aria-hidden="true">
          {paid ? '✓' : '!'}
        </span>
        <PageHeader
          title={`Kết quả thanh toán: ${paid ? 'thành công' : 'chưa thanh toán'}`}
          lead={`Lần thanh toán ${payment.id} · ${formatVnd(payment.amount)} · ${payment.at}`}
        />
      </div>

      {!paid && (
        <EmptyState title="Bạn đã hủy ở VNPay" body="Chưa trừ tiền. Bạn có thể thanh toán lại.">
          <Link to={back} className="mk-btn mk-btn--primary">
            Thanh toán lại
          </Link>
        </EmptyState>
      )}

      {paid && payment.purpose === 'checkout' && (
        <section className="stack" aria-labelledby="created-heading">
          <h2 id="created-heading" className="detail-heading">
            {created.length} đơn vừa tạo
          </h2>
          <ul className="row-list">
            {created.map((o) => (
              <li key={o.id} className="row-list__item">
                <div className="row-list__main">
                  <p className="row-list__title">
                    {o.id} · {o.shop}
                  </p>
                  <p className="muted">{o.lines.map((l) => `${l.name} × ${l.quantity}`).join(', ')}</p>
                </div>
                <StatusBadge tone="soft">Chờ người bán xác nhận</StatusBadge>
                <span className="mk-price">{formatVnd(o.total)}</span>
                <Link to={routes.order(o.id)} className="mk-btn mk-btn--quiet mk-btn--sm">
                  Xem đơn
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {paid && payment.purpose === 'deposit' && (
        <p className="notice">
          Đã đặt cọc. Đơn {String(payment.context.orderId)} được tạo; đơn vị gửi maket trong 24 giờ. Moonkage giữ tiền cọc và chỉ giải ngân theo tiến độ.
        </p>
      )}
      {paid && payment.purpose === 'remaining' && <p className="notice">Đã trả phần còn lại. Đơn {String(payment.context.orderId)} hoàn tất.</p>}
      {paid && payment.purpose === 'seller-fee' && <p className="notice">Đã đóng phí mở bán. Bạn có thể đăng sản phẩm và khai vùng giao.</p>}

      {paid && (
        <div className="row">
          {payment.purpose === 'seller-fee' ? (
            <Link to={routes.sellerChannel} className="mk-btn mk-btn--primary">
              Vào Kênh người bán
            </Link>
          ) : (
            <Link
              to={payment.purpose === 'checkout' ? routes.orders : routes.order(String(payment.context.orderId))}
              className="mk-btn mk-btn--primary"
            >
              {payment.purpose === 'checkout' ? 'Đến Đơn hàng' : 'Xem đơn'}
            </Link>
          )}
          <Link to={routes.home} className="mk-btn mk-btn--quiet">
            Về trang chủ
          </Link>
        </div>
      )}
    </div>
  );
}
