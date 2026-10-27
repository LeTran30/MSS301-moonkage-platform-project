import { mockResponse, seedStore } from '@/shared/api/mock';
import { seedDisbursementRequests, seedPayouts, seedReconciliation } from './platformMoneySeed';
import { seedDisbursements, seedSettlements } from './vendorPayoutSeed';

/** What the shop is owed (settlements) and the deposit it asked to release (disbursements); demo data only. */
export const disbursementStore = seedStore('vendor-disbursements', seedDisbursements);
/** The money Moonkage holds: deposit releases, payouts to vendors, VNPay reconciliation (Q4); demo data only. */
export const disbursementRequestStore = seedStore('admin-disbursements', seedDisbursementRequests);
export const payoutStore = seedStore('admin-payouts', seedPayouts);

export const fetchSettlements = () => mockResponse(seedSettlements);
export const fetchDisbursements = () => mockResponse(disbursementStore.get());
export const fetchDisbursementRequests = () => mockResponse(disbursementRequestStore.get());
export const fetchPayouts = () => mockResponse(payoutStore.get());
export const fetchReconciliation = () => mockResponse(seedReconciliation);
