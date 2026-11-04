import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, ButtonLink, Card, Icon } from '@/shared/ui';
import { usePaymentPoll } from '@/features/checkout';
import { paymentApi } from '@/entities/payment';
import styles from './PaymentResultPage.module.css';

type PaymentResultState = {
  success?: boolean;
  paymentId?: string;
  checkoutId?: string;
  amount?: number;
  orderIds?: string[];
};

/**
 * M4.3 — the result of a VNPay payment (FR-09, AC-09.7, BR-25).
 *
 * The redirect back from the gateway only proves that the payer came back; the
 * payment is really paid when the server-to-server IPN marks it `SUCCEEDED`.
 * The screen therefore polls `GET /api/payments/{paymentId}` and, once the
 * payment succeeded, reads the ids of the orders the checkout created.
 */
export function PaymentResultPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = (location.state as PaymentResultState | null) ?? {};

  // The browser can lose the state of the checkout (a new tab, a reload); the
  // query of VNPay still names the payment, so the page reads it from the
  // backend once (BR-25).
  const [paymentIdFromQuery, setPaymentIdFromQuery] = useState<string | null>(null);

  useEffect(() => {
    // VNPay names the payment in vnp_TxnRef; the local flow passes paymentId.
    const hasCallback = searchParams.has('vnp_TxnRef') || searchParams.has('paymentId');
    if (!hasCallback) return;
    let current = true;
    void paymentApi
      .readVnpayReturn(Object.fromEntries(searchParams.entries()))
      .then((payment) => {
        if (current && payment) setPaymentIdFromQuery(payment.paymentId);
      })
      .catch(() => {
        // The signature did not check out; the state of the checkout remains.
      });
    return () => {
      current = false;
    };
  }, [searchParams]);

  const paymentId = state.paymentId ?? paymentIdFromQuery;
  const poll = usePaymentPoll(paymentId, state.checkoutId ?? null);

  const orderIds = poll.orderIds.length > 0 ? poll.orderIds : (state.orderIds ?? []);
  const amount = poll.amount || state.amount || 0;

  if (poll.kind === 'pending') {
    return (
      <div className={styles.container}>
        <Card padding="lg" className={styles.resultCard}>
          <div className={styles.successIconWrap}>
            <Icon name="clock" size={40} />
          </div>

          <Badge tone="gold" size="md">ĐANG CHỜ XÁC NHẬN THANH TOÁN (M4.3)</Badge>
          <h1 className={styles.title}>Đang chờ cổng thanh toán xác nhận</h1>
          <p className={styles.desc}>
            Khoản tiền {formatCurrency(amount)} đã được gửi tới VNPay. Trang này tự cập nhật ngay khi
            hệ thống nhận được xác nhận (IPN) của cổng thanh toán.
          </p>

          <div className={styles.actions}>
            <ButtonLink to={routes.account.orders} variant="primary" iconLeft="package">
              Về danh sách đơn hàng của tôi
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  if (poll.kind === 'failed') {
    return (
      <div className={styles.container}>
        <Card padding="lg" className={styles.resultCard}>
          <div className={styles.successIconWrap}>
            <Icon name="alert" size={40} />
          </div>

          <Badge tone="red" size="md">THANH TOÁN THẤT BẠI (M4.3)</Badge>
          <h1 className={styles.title}>Thanh toán chưa thành công</h1>
          <p className={styles.desc}>
            Cổng thanh toán đã báo giao dịch không thành công. Khoản tiền chưa được trừ, bạn có thể thử
            thanh toán lại.
          </p>

          <div className={styles.actions}>
            <ButtonLink to={routes.base.cart} variant="primary" iconLeft="cart">
              Quay lại giỏ hàng
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card padding="lg" className={styles.resultCard}>
        <div className={styles.successIconWrap}>
          <Icon name="check" size={40} />
        </div>

        <Badge tone="green" size="md">THANH TOÁN THÀNH CÔNG (M4.3)</Badge>
        <h1 className={styles.title}>Đơn hàng đã được xác nhận thanh toán</h1>
        <p className={styles.desc}>
          Khoản tiền {formatCurrency(amount)} đã được ký quỹ an toàn qua VNPay. Người bán đã nhận được đơn và sẽ tiến hành đóng gói bánh gửi tới bạn.
        </p>

        {/* BR-25, AC-09.7: Hiện N đơn vừa tạo, nhóm theo lần thanh toán; chỉ hiển thị, không đổi trạng thái */}
        <div className={styles.ordersBox}>
          <div className={styles.ordersBoxHeader}>
            <span>Các đơn hàng trong lần thanh toán này:</span>
            <span>
              Mã GD: <code>{poll.payment?.paymentId ?? state.paymentId ?? ''}</code>
            </span>
          </div>

          <div className={styles.orderList}>
            {orderIds.length === 0 ? (
              <p className={styles.desc}>
                Đơn hàng đang được hệ thống tạo, trang danh sách đơn hàng sẽ hiển thị ngay khi sẵn sàng.
              </p>
            ) : (
              orderIds.map((id: string) => (
                <div key={id} className={styles.orderItem}>
                  <div className={styles.orderIdTitle}>
                    <Icon name="package" size={16} /> Đơn hàng <strong>#{id}</strong>
                  </div>
                  <div className={styles.orderActions}>
                    <ButtonLink to={routes.account.order(id)} variant="secondary" size="sm">
                      Xem chi tiết đơn này
                    </ButtonLink>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <ButtonLink to={routes.account.orders} variant="primary" iconLeft="package">
            Về danh sách đơn hàng của tôi
          </ButtonLink>
          <ButtonLink to={routes.base.catalog} variant="secondary">
            Tiếp tục mua sắm
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
