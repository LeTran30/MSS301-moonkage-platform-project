import { useAsync } from '@/shared/lib';
import {
  fetchDisbursableOrders,
  fetchDisbursementRequests,
  fetchDisbursements,
  fetchPayouts,
  fetchReconciliation,
  fetchSettlements,
  fetchVendorMoneySummary,
} from '../api/payoutApi';

export const useSettlements = () => useAsync(fetchSettlements, []);
export const useDisbursements = () => useAsync(fetchDisbursements, []);
export const useDisbursableOrders = () => useAsync(fetchDisbursableOrders, []);
export const useVendorMoneySummary = () => useAsync(fetchVendorMoneySummary, []);
export const useDisbursementRequests = () => useAsync(fetchDisbursementRequests, []);
export const usePayouts = () => useAsync(fetchPayouts, []);
export const useReconciliation = () => useAsync(fetchReconciliation, []);
