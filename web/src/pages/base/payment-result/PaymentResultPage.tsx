import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { routes } from '@/shared/config';
import { formatCurrency } from '@/shared/utils';
import { Badge, ButtonLink, Card, Icon } from '@/shared/ui';
import { usePaymentPoll } from '@/features/checkout';
import { paymentApi, type PaymentDto } from '@/entities/payment';
import { orderCode } from '@/entities/order';
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
/** Câu chữ và lối đi tiếp theo mục đích của khoản tiền. */
function resultCopy(purpose: PaymentDto['purpose'] | undefined, referenceId: string | null) {
  if (purpose === 'DEPOSIT') {
    // The deposit references the custom order it opened.
    const orderTo = referenceId ? routes.account.order(referenceId) : null;
    return {
      title: 'Tiền cọc đã được ký quỹ',
      body: 'Xưởng đã nhận đơn đặt riêng và sẽ gửi maket để bạn duyệt trước khi sản xuất.',
      failedBody: 'Cổng thanh toán báo giao dịch không thành công. Tiền chưa bị trừ, bạn có thể đặt cọc lại.',
      retryTo: routes.account.requests,
      retryLabel: 'Về yêu cầu và báo giá',
      orderTo,
    };
  }
  if (purpose === 'REMAINDER') {
    const orderTo = referenceId ? routes.account.order(referenceId) : null;
    return {
      title: 'Đã thanh toán đủ đơn đặt riêng',
      body: 'Đơn hàng đã hoàn tất.',
      failedBody: 'Cổng thanh toán báo giao dịch không thành công. Tiền chưa bị trừ, bạn có thể thanh toán lại.',
      retryTo: orderTo ?? routes.account.orders,
      retryLabel: 'Về đơn hàng',
      orderTo,
    };
  }
  return {
    title: 'Đơn hàng đã được xác nhận thanh toán',
    body: 'Người bán đã nhận được đơn và sẽ tiến hành đóng gói bánh gửi tới bạn.',
    failedBody:
      'Cổng thanh toán đã báo giao dịch không thành công. Khoản tiền chưa được trừ, bạn có thể thử thanh toán lại.',
    retryTo: routes.base.cart,
    retryLabel: 'Quay lại giỏ hàng',
    orderTo: null as string | null,
  };
}

export function PaymentResultPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = (location.state as PaymentResultState | null) ?? {};

  // The browser can lose the state of the checkout (a new tab, a reload); the
  // query of VNPay still names the payment, so the page reads it from the
  // backend once (BR-25).
  const [paymentIdFromQuery, setPaymentIdFromQuery] = useState<string | null>(null);
  // The return named no payment of the caller (wrong signature, unknown reference).
  const [returnUnknown, setReturnUnknown] = useState(false);

  useEffect(() => {
    // VNPay names the payment in vnp_TxnRef; the local flow passes paymentId.
    const hasCallback = searchParams.has('vnp_TxnRef') || searchParams.has('paymentId');
    if (!hasCallback) return;
    let current = true;
    void paymentApi
      .readVnpayReturn(Object.fromEntries(searchParams.entries()))
      .then((payment) => {
        if (!current) return;
        if (payment) setPaymentIdFromQuery(payment.paymentId);
        else setReturnUnknown(true);
      })
      .catch(() => {
        // The signature did not check out or the payment is unknown; the state of the checkout may remain.
        if (current) setReturnUnknown(true);
      });
    return () => {
      current = false;
    };
  }, [searchParams]);

  const paymentId = state.paymentId ?? paymentIdFromQuery;
  const poll = usePaymentPoll(paymentId, state.checkoutId ?? null);

  const orderIds = poll.orderIds.length > 0 ? poll.orderIds : (state.orderIds ?? []);
  const amount = poll.amount || state.amount || 0;
  const purpose = poll.payment?.purpose;
  const copy = resultCopy(purpose, poll.payment?.referenceId ?? null);
  const isCheckout = !purpose || purpose === 'CHECKOUT';

  // Nothing names a payment: never show a success the server has not confirmed.
  const awaitsReturn = searchParams.has('vnp_TxnRef') || searchParams.has('paymentId');
  if (poll.kind === 'idle' && (returnUnknown || (!paymentId && !awaitsReturn))) {
    return (
      <div className={styles.container}>
        <Card padding="lg" className={styles.resultCard}>
          <div className={styles.successIconWrap}>
            <Icon name="alert" size={40} />
          </div>
          <Badge tone="red" size="md">
            KHÔNG XÁC NHẬN ĐƯỢC GIAO DỊCH
          </Badge>
          <h1 className={styles.title}>Chưa tìm thấy giao dịch này</h1>
          <p className={styles.desc}>
            Hệ thống chưa nhận ra giao dịch VNPay vừa trả về. Nếu tài khoản đã bị trừ tiền, đơn sẽ được cập nhật khi
            cổng thanh toán xác nhận; bạn có thể xem lại trong danh sách đơn hàng.
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

  if (poll.kind === 'pending' || poll.kind === 'idle') {
    return (
      <div className={styles.container}>
        <Card padding="lg" className={styles.resultCard}>
          <div className={styles.successIconWrap}>
            <Icon name="clock" size={40} />
          </div>

          <Badge tone="gold" size="md">
            ĐANG CHỜ XÁC NHẬN THANH TOÁN
          </Badge>
          <h1 className={styles.title}>Đang chờ cổng thanh toán xác nhận</h1>
          <p className={styles.desc}>
            Khoản tiền {formatCurrency(amount)} đã được gửi tới VNPay. Trang này tự cập nhật ngay
            khi hệ thống nhận được xác nhận (IPN) của cổng thanh toán.
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

          <Badge tone="red" size="md">
            THANH TOÁN THẤT BẠI
          </Badge>
          <h1 className={styles.title}>Thanh toán chưa thành công</h1>
          <p className={styles.desc}>{copy.failedBody}</p>

          <div className={styles.actions}>
            <ButtonLink to={copy.retryTo} variant="primary">
              {copy.retryLabel}
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

        <Badge tone="green" size="md">
          THANH TOÁN THÀNH CÔNG
        </Badge>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.desc}>
          Khoản tiền {formatCurrency(amount)} đã được ký quỹ an toàn qua VNPay. {copy.body}
        </p>

        {isCheckout && (
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
                  Đơn hàng đang được hệ thống tạo, trang danh sách đơn hàng sẽ hiển thị ngay khi sẵn
                  sàng.
                </p>
              ) : (
                orderIds.map((id: string) => (
                  <div key={id} className={styles.orderItem}>
                    <div className={styles.orderIdTitle}>
                      <Icon name="package" size={16} /> Đơn hàng <strong>#{orderCode(id)}</strong>
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
        )}

        {copy.orderTo && (
          <div className={styles.actions}>
            <ButtonLink to={copy.orderTo} variant="secondary" iconLeft="package">
              Xem đơn hàng
            </ButtonLink>
          </div>
        )}

        <div className={styles.actions}>
          <ButtonLink to={routes.account.orders} variant="primary" iconLeft="package">
            Về danh sách đơn hàng của tôi
          </ButtonLink>
          {/* Đơn đặt riêng đi tiếp ở trang đơn, không quay lại mua lẻ. */}
          {purpose !== 'DEPOSIT' && purpose !== 'REMAINDER' && (
            <ButtonLink to={routes.base.catalog} variant="secondary">
              Tiếp tục mua sắm
            </ButtonLink>
          )}
        </div>
      </Card>
    </div>
  );
}
