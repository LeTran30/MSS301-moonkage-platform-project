import { useAsync } from '../../../shared/ui';
import {
  decideApplication,
  decideDisbursement,
  decideDispute,
  fetchAdminProducts,
  fetchApplication,
  fetchApplications,
  fetchDisbursementRequests,
  fetchDispute,
  fetchDisputes,
  fetchPayouts,
  fetchProvinceFees,
  fetchReconciliation,
  fetchSellerFee,
  fetchTaxonomy,
  payOut,
  saveProvinceFees,
  saveSellerFee,
  saveTaxonomy,
  takeDownProduct,
} from '../api/adminApi';
import type {
  AdminProduct,
  ApplicationState,
  DisbursementRequest,
  Dispute,
  Payout,
  ProvinceFee,
  Reconciliation,
  SellerApplication,
  Taxonomy,
} from '../api/types';

export type {
  AdminProduct,
  ApplicationState,
  DisbursementRequest,
  Dispute,
  Payout,
  ProvinceFee,
  Reconciliation,
  SellerApplication,
  Taxonomy,
};

export {
  decideApplication,
  decideDisbursement,
  decideDispute,
  payOut,
  saveProvinceFees,
  saveSellerFee,
  saveTaxonomy,
  takeDownProduct,
};

export const useApplications = () => useAsync(fetchApplications, []);
export const useApplication = (id: string) => useAsync(() => fetchApplication(id), [id]);
export const useAdminProducts = () => useAsync(fetchAdminProducts, []);
export const useDisbursementRequests = () => useAsync(fetchDisbursementRequests, []);
export const usePayouts = () => useAsync(fetchPayouts, []);
export const useReconciliation = () => useAsync(fetchReconciliation, []);
export const useDisputes = () => useAsync(fetchDisputes, []);
export const useDispute = (id: string) => useAsync(() => fetchDispute(id), [id]);
export const useProvinceFees = () => useAsync(fetchProvinceFees, []);
export const useSellerFeeConfig = () => useAsync(fetchSellerFee, []);
export const useTaxonomy = () => useAsync(fetchTaxonomy, []);
