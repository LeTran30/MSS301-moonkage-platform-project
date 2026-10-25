import { mockResponse, seedStore } from '../../../shared/api/mock';

/**
 * One VNPay payment (M4.2): checkout of ready-made orders, a deposit, the rest of a custom order, or the seller fee.
 * In the demo the VNPay page is simulated; `context` carries what the page that started it needs afterwards.
 */
export type PaymentPurpose = 'checkout' | 'deposit' | 'remaining' | 'seller-fee';

export interface Payment {
  id: string;
  purpose: PaymentPurpose;
  amount: number;
  description: string;
  /** Free-form data the starting page reads back on the result page. */
  context: Record<string, unknown>;
  status: 'pending' | 'paid' | 'cancelled';
  at: string;
}

const payments = seedStore<Payment[]>('payments', []);

export function startPayment(purpose: PaymentPurpose, amount: number, description: string, context: Record<string, unknown> = {}): Promise<Payment> {
  const payment: Payment = {
    id: `PAY-${99300 + payments.get().length}`,
    purpose,
    amount,
    description,
    context,
    status: 'pending',
    at: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };
  payments.update((list) => [payment, ...list]);
  return mockResponse(payment);
}

export function fetchPayment(paymentId: string): Promise<Payment | null> {
  return mockResponse(payments.get().find((p) => p.id === paymentId) ?? null);
}

/** What VNPay answers (simulated): paid or cancelled. */
export function finishPayment(paymentId: string, paid: boolean): Promise<Payment | null> {
  const next = payments.update((list) => list.map((p) => (p.id === paymentId ? { ...p, status: paid ? 'paid' : 'cancelled' } : p)));
  return mockResponse(next.find((p) => p.id === paymentId) ?? null);
}

/** Records the result of the follow-up step (orders created…) so a reload of the result page shows it again. */
export function updatePaymentContext(paymentId: string, context: Record<string, unknown>) {
  payments.update((list) => list.map((p) => (p.id === paymentId ? { ...p, context: { ...p.context, ...context } } : p)));
}
