import { mockResponse, seedStore } from '@/shared/api/mock';

/**
 * One VNPay payment (M4.2): checkout of ready-made orders, a deposit, the rest of a custom order, or the vendor fee.
 * In the demo the VNPay page is simulated; `context` carries what the page that started it needs afterwards.
 */
export type PaymentPurpose = 'checkout' | 'deposit' | 'remaining' | 'vendor-fee';

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

export const paymentStore = seedStore<Payment[]>('payments', []);

export function fetchPayment(paymentId: string): Promise<Payment | null> {
  return mockResponse(paymentStore.get().find((p) => p.id === paymentId) ?? null);
}
