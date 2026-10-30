import { useAsync } from '@/shared/lib';
import { fetchDisbursementRequests, fetchDisbursements, fetchPayouts, fetchReconciliation, fetchSettlements } from '../api/payoutApi';

export const useSettlements = () => useAsync(fetchSettlements, []);
export const useDisbursements = () => useAsync(fetchDisbursements, []);
export const useDisbursementRequests = () => useAsync(fetchDisbursementRequests, []);
export const usePayouts = () => useAsync(fetchPayouts, []);
export const useReconciliation = () => useAsync(fetchReconciliation, []);
