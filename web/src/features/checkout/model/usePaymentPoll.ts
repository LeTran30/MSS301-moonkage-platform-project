import { useEffect, useRef, useState } from 'react';
import { orderApi } from '@/entities/order';
import { paymentApi, type PaymentDto } from '@/entities/payment';
import { ANALYTICS_EVENTS, trackEvent } from '@/shared/observability';

/**
 * Poll the state of a payment until the IPN of the gateway arrives (BR-25).
 *
 * The VNPay return page only proves that the payer came back; the payment is
 * really paid when the server-to-server IPN marks it `SUCCEEDED`. The screen
 * therefore asks the backend instead of trusting the redirect (AC-09.7).
 */
export type PaymentPollState = {
  kind: 'idle' | 'pending' | 'succeeded' | 'failed';
  payment?: PaymentDto | null;
  /** The ids of the orders the payment created, once it succeeded. */
  orderIds: string[];
  amount: number;
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 30;

/**
 * Poll one payment and, once it succeeded, the checkout that created it.
 *
 * `checkoutId` is optional: a registration fee or a deposit has no checkout,
 * only a payment.
 */
export function usePaymentPoll(
  paymentId: string | null,
  checkoutId: string | null
): PaymentPollState {
  const [state, setState] = useState<PaymentPollState>({
    kind: 'idle',
    orderIds: [],
    amount: 0,
  });
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!paymentId) return;
    let current = true;
    pollsRef.current = 0;

    async function poll() {
      if (!current) return;
      const paymentIdToRead = paymentId;
      if (!paymentIdToRead) return;
      pollsRef.current += 1;

      try {
        const payment = await paymentApi.getById(paymentIdToRead);
        if (!current) return;

        if (!payment) {
          // Demo mode (no backend): nothing to poll.
          setState({ kind: 'pending', orderIds: [], amount: 0 });
          return;
        }

        if (payment.status === 'SUCCEEDED' || payment.status === 'DUPLICATE') {
          let orderIds: string[] = [];
          const checkoutIdToRead = checkoutId;
          if (checkoutIdToRead) {
            const checkout = await orderApi.getCheckout(checkoutIdToRead);
            if (current) orderIds = checkout?.orderIds ?? [];
          }
          if (!current) return;

          // Funnel: thanh toán thành công (FR-09). Không ghi `amount` — số
          // tiền là dữ liệu tài chính của đơn hàng (NFR-03).
          trackEvent(ANALYTICS_EVENTS.purchase, {
            payment_id: paymentIdToRead,
            order_count: orderIds.length,
          });

          setState({
            kind: 'succeeded',
            payment,
            orderIds,
            amount: payment.amount,
          });
          return;
        }

        if (payment.status === 'FAILED') {
          if (!current) return;
          setState({ kind: 'failed', payment, orderIds: [], amount: payment.amount });
          return;
        }

        // Still `PENDING`: the IPN has not arrived yet.
        if (!current) return;
        setState({ kind: 'pending', payment, orderIds: [], amount: payment.amount });

        if (pollsRef.current < MAX_POLLS) {
          window.setTimeout(() => void poll(), POLL_INTERVAL_MS);
        }
      } catch {
        if (!current) return;
        setState({ kind: 'pending', orderIds: [], amount: 0 });
      }
    }

    void poll();
    return () => {
      current = false;
    };
  }, [paymentId, checkoutId]);

  return state;
}
