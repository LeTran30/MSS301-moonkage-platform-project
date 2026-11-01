import { mockResponse } from '@/shared/api/mock';
import { routes } from '@/shared/config/routes';
import { today } from '@/shared/utils/format';
import { paymentStore, type Payment, type PaymentLink, type PaymentPurpose } from './paymentApi';

/** Demo mode: a payment in the demo store, paid on the simulated VNPay page. */
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

/** Demo mode: the same as startPayment, as the link a real payment answers with. */
export async function startDemoPayment(...args: Parameters<typeof startPayment>): Promise<PaymentLink> {
  const payment = await startPayment(...args);
  return { paymentId: payment.id, paymentUrl: routes.gateway.vnpay(payment.id) };
}
