import { useQueryData } from '@/shared/lib';
import { queryKeys } from '@/shared/api';
import { refundApi } from '../api/refundApi';

/** The refunds VNPay refused, waiting for an admin to settle them by hand (AC-49.3). */
export function useManualRefunds() {
  return useQueryData(queryKeys.refund.manual(), () => refundApi.list());
}
