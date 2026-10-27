import { useAsync } from '../../../shared/ui';
import {
  fetchPayment,
  finishPayment,
  startPayment,
  updatePaymentContext,
  type Payment,
  type PaymentPurpose,
} from '../api/paymentsApi';

export type { Payment, PaymentPurpose };
export { fetchPayment, finishPayment, startPayment, updatePaymentContext };

export function usePayment(paymentId: string) {
  return useAsync(() => fetchPayment(paymentId), [paymentId]);
}
