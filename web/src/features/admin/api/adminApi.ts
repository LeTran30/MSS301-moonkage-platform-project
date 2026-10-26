import { demoStore } from '../../../shared/api/demo';
import { mockResponse, seedStore } from '../../../shared/api/mock';
import {
  seedAdminProducts,
  seedApplications,
  seedDisbursementRequests,
  seedDisputes,
  seedPayouts,
  seedProvinceFees,
  seedReconciliation,
  seedTaxonomy,
} from './seed';
import type { ApplicationState, DisbursementRequest, Dispute, ProvinceFee, SellerApplication, Taxonomy } from './types';

/** Admin area on seed data; every decision is kept in the demo store. */
const applications = seedStore('admin-applications', seedApplications);
const products = seedStore('admin-products', seedAdminProducts);
const disbursements = seedStore('admin-disbursements', seedDisbursementRequests);
const payouts = seedStore('admin-payouts', seedPayouts);
const disputes = seedStore('admin-disputes', seedDisputes);
const fees = seedStore('admin-province-fees', seedProvinceFees);
const sellerFee = seedStore('admin-seller-fee', 200000);
const taxonomy = seedStore('admin-taxonomy', seedTaxonomy);

const today = () => new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const fetchApplications = () => mockResponse(applications.get());
export const fetchApplication = (id: string) => mockResponse(applications.get().find((a) => a.id === id) ?? null);

/**
 * Decide on a seller profile. The applicant's seller channel reads `seller-state:<account>`: the same record a
 * backend would update.
 */
export function decideApplication(id: string, state: ApplicationState, note?: string): Promise<SellerApplication | null> {
  const labels: Record<ApplicationState, string> = {
    approved: 'Quản trị duyệt hồ sơ',
    'needs-more': `Quản trị yêu cầu bổ sung: ${note ?? ''}`,
    rejected: `Quản trị từ chối hồ sơ: ${note ?? ''}`,
    locked: 'Quản trị khóa người bán',
    pending: 'Chờ duyệt',
  };
  const next = applications.update((list) =>
    list.map((a) => (a.id === id ? { ...a, state, history: [{ label: labels[state], at: today() }, ...a.history] } : a)),
  );
  const app = next.find((a) => a.id === id) ?? null;
  if (app?.account) {
    const sellerState = state === 'approved' ? 'approved' : state === 'locked' ? 'rejected' : state;
    demoStore.set(`seller-state:${app.account}`, { state: sellerState, moreNeeded: note, approvedAt: state === 'approved' ? today() : undefined });
  }
  return mockResponse(app);
}

export const fetchAdminProducts = () => mockResponse(products.get());
export function takeDownProduct(id: string, reason: string) {
  products.update((list) => list.map((p) => (p.id === id ? { ...p, removed: { reason, at: today() } } : p)));
  return mockResponse(true);
}

export const fetchDisbursementRequests = () => mockResponse(disbursements.get());
export function decideDisbursement(id: string, approve: boolean, refusal?: string): Promise<DisbursementRequest[]> {
  return mockResponse(disbursements.update((list) => list.map((d) => (d.id === id ? { ...d, state: approve ? 'approved' : 'refused', refusal } : d))));
}

export const fetchPayouts = () => mockResponse(payouts.get());
export function payOut(orderIds: string[]) {
  payouts.update((list) => list.map((p) => (orderIds.includes(p.orderId) ? { ...p, paid: true } : p)));
  return mockResponse(true);
}

export const fetchReconciliation = () => mockResponse(seedReconciliation);

export const fetchDisputes = () => mockResponse(disputes.get());
export const fetchDispute = (id: string) => mockResponse(disputes.get().find((d) => d.id === id) ?? null);
export function decideDispute(id: string, kind: string, amount: number, note: string): Promise<Dispute | null> {
  const next = disputes.update((list) =>
    list.map((d) =>
      d.id === id
        ? { ...d, state: 'decided', decision: { kind, amount, note, at: today() }, history: [{ label: 'Quản trị quyết định', at: today() }, ...d.history] }
        : d,
    ),
  );
  return mockResponse(next.find((d) => d.id === id) ?? null);
}

export const fetchProvinceFees = () => mockResponse(fees.get());
export function saveProvinceFees(next: ProvinceFee[]) {
  fees.update(() => next);
  return mockResponse(true);
}

export const fetchSellerFee = () => mockResponse(sellerFee.get());
export function saveSellerFee(amount: number) {
  sellerFee.update(() => amount);
  return mockResponse(true);
}

export const fetchTaxonomy = () => mockResponse(taxonomy.get());
export function saveTaxonomy(next: Taxonomy) {
  taxonomy.update(() => next);
  return mockResponse(true);
}
