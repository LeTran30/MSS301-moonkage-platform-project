import { useEffect, useState } from 'react';
import { useCart } from '@/entities/cart';
import { fetchOrder, readyTotal, type OrderLine, type ReadyOrder } from '@/entities/order';
import { fetchPayment, type Payment } from '@/entities/payment';
import { fetchCheckout } from '@/features/checkout';
import { updatePaymentContext } from '@/features/pay';
import { markFeePaid } from '@/features/pay-vendor-fee';
import { createCustomOrder, createReadyOrders, markRemainingPaid } from '@/features/place-order';
import { config } from '@/shared/config/env';

interface CheckoutContext {
  groups: { shop: string; shippingFee: number; lines: OrderLine[] }[];
  address: ReadyOrder['address'];
  invoice: ReadyOrder['invoice'] | null;
}

/** What the result page lists for a paid checkout. */
const createdOrder = (o: ReadyOrder) => ({ id: o.id, shop: o.shop, total: readyTotal(o), lines: o.lines });

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Asks again until `done`, at most `config.paymentPollAttempts` times; answers the last answer. */
async function pollUntil<T>(read: () => Promise<T>, done: (value: T) => boolean, alive: () => boolean): Promise<T> {
  let value = await read();
  for (let i = 1; i < config.paymentPollAttempts && !done(value) && alive(); i++) {
    await wait(config.paymentPollIntervalMs);
    value = await read();
  }
  return value;
}

/**
 * Demo mode: does, once, what the payment was for (create the orders of a checkout, the order of a deposit, close
 * the rest of a custom order) and remembers it on the payment so a reload shows the same result.
 */
async function demoFollowUp(paymentId: string, clearCart: () => void): Promise<Payment | null> {
  const p = await fetchPayment(paymentId);
  if (p && p.status === 'paid' && !p.context.done) {
    if (p.purpose === 'checkout') {
      const c = p.context as unknown as CheckoutContext;
      const orders = await createReadyOrders(p.id, c.groups, c.address, c.invoice ?? undefined);
      clearCart();
      p.context = { ...p.context, done: true, orders: orders.map(createdOrder) };
    } else if (p.purpose === 'deposit') {
      const c = p.context as { vendorName: string; title: string; requestId: string; value: number; depositPercent: number };
      const order = await createCustomOrder(c);
      p.context = { ...p.context, done: true, orderId: order.id };
    } else if (p.purpose === 'remaining') {
      await markRemainingPaid(p.context.orderId as string);
      p.context = { ...p.context, done: true };
    } else if (p.purpose === 'vendor-fee') {
      await markFeePaid();
      p.context = { ...p.context, done: true };
    }
    updatePaymentContext(p.id, p.context);
  }
  return p;
}

/**
 * On the server the IPN marks the payment and the services create what it paid for (BR-25): wait for both, then
 * read the orders a checkout created.
 */
async function serverFollowUp(paymentId: string, clearCart: () => void, alive: () => boolean): Promise<Payment | null> {
  const p = await pollUntil(() => fetchPayment(paymentId), (x) => x?.status !== 'pending', alive);
  if (!p || p.status !== 'paid') return p;
  const referenceId = String(p.context.referenceId);
  if (p.purpose === 'checkout') {
    const checkout = await pollUntil(() => fetchCheckout(referenceId), (c) => c.status !== 'PENDING_PAYMENT', alive);
    const orders = await Promise.all(checkout.orderIds.map(fetchOrder));
    clearCart();
    p.context = { ...p.context, orders: orders.flatMap((o) => (o?.kind === 'ready' ? [createdOrder(o)] : [])) };
  } else if (p.purpose === 'remaining') {
    p.context = { ...p.context, orderId: referenceId };
  }
  return p;
}

/** After VNPay answers: the payment, with what it created in its context. */
export function usePaymentFollowUp(paymentId: string) {
  const { clear } = useCart();
  const [payment, setPayment] = useState<Payment | null | undefined>(undefined);

  useEffect(() => {
    let current = true;
    const alive = () => current;
    void (config.demoMode ? demoFollowUp(paymentId, clear) : serverFollowUp(paymentId, clear, alive))
      .catch(() => null)
      .then((p) => {
        if (current) setPayment(p);
      });
    return () => {
      current = false;
    };
  }, [paymentId, clear]);

  return payment;
}
