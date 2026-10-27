import { paymentStore, type Payment, type PaymentPurpose } from '@/entities/payment';
import { mockResponse } from '@/shared/api/mock';
import { today } from '@/shared/utils/format';

export function startPayment(purpose: PaymentPurpose, amount: number, description: string, context: Record<string, unknown> = {}): Promise<Payment> {
  const payment: Payment = {
    id: `PAY-${99300 + paymentStore.get().length}`,
    purpose,
    amount,
    description,
    context,
    status: 'pending',
    at: today(),
  };
  paymentStore.update((list) => [payment, ...list]);
  return mockResponse(payment);
}

/** What VNPay answers (simulated): paid or cancelled. */
export function finishPayment(paymentId: string, paid: boolean): Promise<Payment | null> {
  const next = paymentStore.update((list) => list.map((p) => (p.id === paymentId ? { ...p, status: paid ? 'paid' : 'cancelled' } : p)));
  return mockResponse(next.find((p) => p.id === paymentId) ?? null);
}

/** Records the result of the follow-up step (orders created…) so a reload of the result page shows it again. */
export function updatePaymentContext(paymentId: string, context: Record<string, unknown>) {
  paymentStore.update((list) => list.map((p) => (p.id === paymentId ? { ...p, context: { ...p.context, ...context } } : p)));
}
