import { remainingAmount, type CustomOrder } from '@/entities/order';
import { paymentStore, startDemoPayment, type Payment, type PaymentLink } from '@/entities/payment';
import { apiClient, type ApiResponse } from '@/shared/api/client';
import { ordersPath } from '@/shared/api/gateway';
import { mockResponse } from '@/shared/api/mock';
import { config } from '@/shared/config/env';

/** What VNPay answers (simulated): paid or cancelled. */
export function finishPayment(paymentId: string, paid: boolean): Promise<Payment | null> {
  const next = paymentStore.update((list) => list.map((p) => (p.id === paymentId ? { ...p, status: paid ? 'paid' : 'cancelled' } : p)));
  return mockResponse(next.find((p) => p.id === paymentId) ?? null);
}

/** Records the result of the follow-up step (orders created…) so a reload of the result page shows it again. */
export function updatePaymentContext(paymentId: string, context: Record<string, unknown>) {
  paymentStore.update((list) => list.map((p) => (p.id === paymentId ? { ...p, context: { ...p.context, ...context } } : p)));
}

/** FR-22: pay the rest of a delivered custom order. */
export async function payRemainder(order: CustomOrder): Promise<PaymentLink> {
  if (config.demoMode) return startDemoPayment('remaining', remainingAmount(order), `Phần còn lại đơn ${order.id}`, { orderId: order.id });
  const res = await apiClient.post<ApiResponse<PaymentLink>>(`${ordersPath}/${encodeURIComponent(order.id)}/payments`);
  return res.data.data;
}
