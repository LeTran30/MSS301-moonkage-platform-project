import { useAsync } from '@/shared/lib';
import { fetchPayment } from '../api/paymentApi';

export function usePayment(paymentId: string) {
  return useAsync(() => fetchPayment(paymentId), [paymentId]);
}
