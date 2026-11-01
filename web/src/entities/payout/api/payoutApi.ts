import { mockResponse, seedStore } from '@/shared/api/mock';
import { fetchMyVendorId, fetchVendorNames } from '@/shared/api/vendors';
import { config } from '@/shared/config/env';
import { formatDate } from '@/shared/utils/format';
import type { Disbursement, DisbursementRequest, Payout, Reconciliation, Settlement, VendorMoneySummary } from '../model/types';
import {
  fetchDisbursementsOf,
  fetchLedgers,
  fetchOrderMoney,
  fetchPayments,
  type DisbursementDto,
  type DisbursementPurposeDto,
  type LedgerDto,
  type PaymentSumDto,
} from './ledgerDto';
import { seedDisbursementRequests, seedPayouts, seedReconciliation } from './platformMoneySeed';
import { seedDisbursements, seedMoneySummary, seedSettlements } from './vendorPayoutSeed';

/** Demo mode: what the shop is owed (settlements) and the deposit it asked to release (disbursements). */
export const disbursementStore = seedStore('vendor-disbursements', seedDisbursements);
/** Demo mode: the money Moonkage holds: deposit releases, payouts to vendors, VNPay reconciliation (Q4). */
export const disbursementRequestStore = seedStore('admin-disbursements', seedDisbursementRequests);
export const payoutStore = seedStore('admin-payouts', seedPayouts);

/** AC-41.1, in the order the request form lists them. */
export const DISBURSEMENT_PURPOSES: { code: DisbursementPurposeDto; label: string }[] = [
  { code: 'MATERIALS', label: 'Mua nguyên liệu' },
  { code: 'PRINTING', label: 'In ấn hộp, logo' },
  { code: 'PACKAGING', label: 'Bao bì, đóng gói' },
  { code: 'RESTOCK', label: 'Nhập thêm hàng' },
];

const purposeLabel = (code: DisbursementPurposeDto) => DISBURSEMENT_PURPOSES.find((p) => p.code === code)?.label ?? code;

const sum = <T>(list: T[], of: (x: T) => number) => list.reduce((n, x) => n + of(x), 0);

async function myLedgers(): Promise<{ vendorId: string | null; ledgers: LedgerDto[] }> {
  const vendorId = await fetchMyVendorId();
  return { vendorId, ledgers: vendorId ? await fetchLedgers({ vendorId }) : [] };
}

function settlementState(l: LedgerDto): string {
  if (l.paidOut > 0) return 'Đã chuyển';
  if (l.disputeOpen) return 'Tạm dừng · khiếu nại';
  return l.expectedPayoutDate ? `Dự kiến chuyển ${formatDate(l.expectedPayoutDate)}` : 'Chờ hết hạn khiếu nại';
}

/** FR-43: each delivered buy-now order of the Shop with what it brings in. */
export async function fetchSettlements(): Promise<Settlement[]> {
  if (config.demoMode) return mockResponse(seedSettlements);
  const { vendorId, ledgers } = await myLedgers();
  if (!vendorId) return [];
  const orders = await fetchOrderMoney(vendorId);
  return ledgers.flatMap((l): Settlement[] => {
    const o = orders.get(l.orderId);
    if (l.kind !== 'BUY_NOW' || !o?.deliveredAt) return [];
    return [{ orderId: l.orderId, deliveredAt: formatDate(o.deliveredAt), goods: o.itemsAmount, shipping: o.shippingFee, state: settlementState(l) }];
  });
}

function disbursementState(d: DisbursementDto): string {
  if (d.status === 'PENDING') return 'Chờ quản trị duyệt';
  if (d.status === 'APPROVED') return `Đã giải ngân ${formatDate(d.decidedAt)}`;
  return d.reason ? `Bị từ chối · ${d.reason}` : 'Bị từ chối';
}

/** FR-41: the deposit releases the Shop asked for. */
export async function fetchDisbursements(): Promise<Disbursement[]> {
  if (config.demoMode) return mockResponse(disbursementStore.get());
  const { ledgers } = await myLedgers();
  const heldOf = new Map(ledgers.map((l) => [l.orderId, l.held]));
  return (await fetchDisbursementsOf(ledgers)).map((d) => ({
    orderId: d.orderId,
    milestone: purposeLabel(d.purpose),
    amount: d.approvedAmount ?? d.amount,
    heldAfter: heldOf.get(d.orderId) ?? 0,
    state: disbursementState(d),
  }));
}

/** The Shop's custom orders with deposit still held: those a release can be asked for. */
export async function fetchDisbursableOrders(): Promise<{ orderId: string; held: number }[]> {
  if (config.demoMode) return mockResponse([{ orderId: 'MK-C088', held: 9000000 }]);
  const { ledgers } = await myLedgers();
  return ledgers.filter((l) => l.kind === 'CUSTOM_ORDER' && l.held > 0).map((l) => ({ orderId: l.orderId, held: l.held }));
}

/** B5.0 tiles. */
export async function fetchVendorMoneySummary(): Promise<VendorMoneySummary> {
  if (config.demoMode) return mockResponse(seedMoneySummary);
  const { ledgers } = await myLedgers();
  return {
    held: sum(ledgers, (l) => l.held),
    toReceive: sum(
      ledgers.filter((l) => l.paidOut === 0),
      (l) => l.toReceive,
    ),
    received: sum(ledgers, (l) => l.paidOut + l.disbursed),
  };
}

const requestState: Record<DisbursementDto['status'], DisbursementRequest['state']> = {
  PENDING: 'waiting',
  APPROVED: 'approved',
  REJECTED: 'refused',
};

/** FR-47, admin: every release asked on a custom order. */
export async function fetchDisbursementRequests(): Promise<DisbursementRequest[]> {
  if (config.demoMode) return mockResponse(disbursementRequestStore.get());
  const [ledgers, names] = await Promise.all([fetchLedgers(), fetchVendorNames()]);
  const ledgerOf = new Map(ledgers.map((l) => [l.orderId, l]));
  return (await fetchDisbursementsOf(ledgers)).map((d) => {
    const l = ledgerOf.get(d.orderId);
    return {
      id: d.requestId,
      orderId: d.orderId,
      vendor: (l && names.get(l.vendorId)) ?? l?.vendorId ?? '',
      askedAt: formatDate(d.createdAt),
      milestone: purposeLabel(d.purpose),
      amount: d.amount,
      heldNow: l?.held ?? 0,
      disbursedBefore: l?.disbursed ?? 0,
      state: requestState[d.status],
      refusal: d.reason ?? undefined,
    };
  });
}

/**
 * FR-48, admin: what is still owed to vendors. An order the server does not find payable (dispute open, window not
 * over) is listed but blocked; one already paid out is listed as paid.
 */
export async function fetchPayouts(): Promise<Payout[]> {
  if (config.demoMode) return mockResponse(payoutStore.get());
  const [ledgers, names] = await Promise.all([fetchLedgers(), fetchVendorNames()]);
  return ledgers
    .filter((l) => l.paidOut > 0 || (l.toReceive > 0 && (l.payable || l.disputeOpen)))
    .map((l) => ({
      orderId: l.orderId,
      vendor: names.get(l.vendorId) ?? l.vendorId,
      complaintEnds: l.expectedPayoutDate ? formatDate(l.expectedPayoutDate) : '—',
      amount: l.paidOut > 0 ? l.paidOut : l.toReceive,
      blocked: l.paidOut > 0 || l.payable ? undefined : 'Chặn · đang khiếu nại',
      paid: l.paidOut > 0,
    }));
}

const paymentKind: Record<PaymentSumDto['purpose'], string> = {
  CHECKOUT: 'Mua hàng có sẵn',
  DEPOSIT: 'Đặt cọc',
  REMAINDER: 'Phần còn lại',
  REGISTRATION_FEE: 'Phí mở bán',
};

/** `MM/YYYY` of an ISO time, in Vietnam. */
const monthOf = (iso: string) => formatDate(iso).slice(3);

/**
 * Q4.3, admin: this month's VNPay payments against what the system kept of them. A DUPLICATE payment came in from
 * VNPay but was refunded, not kept (P-03): it is the line that disagrees.
 */
export async function fetchReconciliation(): Promise<Reconciliation> {
  if (config.demoMode) return mockResponse(seedReconciliation);
  const [payments, ledgers] = await Promise.all([fetchPayments(), fetchLedgers()]);
  const month = monthOf(new Date().toISOString());
  const paid = payments.filter((p) => (p.status === 'SUCCEEDED' || p.status === 'DUPLICATE') && p.paidAt && monthOf(p.paidAt) === month);
  return {
    month,
    vnpay: sum(paid, (p) => p.amount),
    held: sum(ledgers, (l) => l.held),
    paidOut: sum(ledgers, (l) => l.paidOut),
    vendorFees: sum(
      paid.filter((p) => p.purpose === 'REGISTRATION_FEE' && p.status === 'SUCCEEDED'),
      (p) => p.amount,
    ),
    rows: paid.map((p) => ({ id: p.paymentId, kind: paymentKind[p.purpose], vnpay: p.amount, system: p.status === 'DUPLICATE' ? 0 : p.amount })),
  };
}
