import { useEffect, useState } from 'react';
import { useCart } from '@/entities/cart';
import type { OrderLine, ReadyOrder } from '@/entities/order';
import { fetchPayment, type Payment } from '@/entities/payment';
import { updatePaymentContext } from '@/features/pay';
import { markFeePaid } from '@/features/pay-vendor-fee';
import { createCustomOrder, createReadyOrders, markRemainingPaid } from '@/features/place-order';

interface CheckoutContext {
  groups: { shop: string; shippingFee: number; lines: OrderLine[] }[];
  address: ReadyOrder['address'];
  invoice: ReadyOrder['invoice'] | null;
}

/**
 * After VNPay answers: does, once, what the payment was for (create the orders of a checkout, the order of a
 * deposit, close the rest of a custom order) and remembers it on the payment so a reload shows the same result.
 */
export function usePaymentFollowUp(paymentId: string) {
  const { clear } = useCart();
  const [payment, setPayment] = useState<Payment | null | undefined>(undefined);

  useEffect(() => {
    let current = true;
    void (async () => {
      const p = await fetchPayment(paymentId);
      if (p && p.status === 'paid' && !p.context.done) {
        if (p.purpose === 'checkout') {
          const c = p.context as unknown as CheckoutContext;
          const orders = await createReadyOrders(p.id, c.groups, c.address, c.invoice ?? undefined);
          clear();
          p.context = { ...p.context, done: true, orders: orders.map((o) => ({ id: o.id, shop: o.shop, total: o.lines.reduce((n, l) => n + l.price * l.quantity, 0) + o.shippingFee, lines: o.lines })) };
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
      if (current) setPayment(p);
    })();
    return () => {
      current = false;
    };
  }, [paymentId, clear]);

  return payment;
}
