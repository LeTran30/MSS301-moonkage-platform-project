import { apiClient, type ApiResponse } from '@/shared/api/client';
import { ledgersPath, ordersPath, paymentsPath } from '@/shared/api/gateway';

/** payment-service `LedgerResponse`: the money of one order (FR-43, AC-43.1). */
export interface LedgerDto {
  orderId: string;
  vendorId: string;
  /** BUY_NOW or CUSTOM_ORDER; null until order-service's events arrived */
  kind: 'BUY_NOW' | 'CUSTOM_ORDER' | null;
  orderStatus: string | null;
  totalCollected: number;
  held: number;
  disbursed: number;
  refunded: number;
  paidOut: number;
  toReceive: number;
  expectedPayoutDate: string | null;
  disputeOpen: boolean;
  payable: boolean;
}

export type DisbursementPurposeDto = 'MATERIALS' | 'PRINTING' | 'PACKAGING' | 'RESTOCK';

/** payment-service `DisbursementResponse`. */
export interface DisbursementDto {
  requestId: string;
  orderId: string;
  amount: number;
  approvedAmount: number | null;
  purpose: DisbursementPurposeDto;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string | null;
  createdAt: string;
  decidedAt: string | null;
}

/** order-service `OrderResponse`, the fields a money screen shows. */
export interface OrderMoneyDto {
  id: string;
  itemsAmount: number;
  shippingFee: number;
  deliveredAt: string | null;
}

/** payment-service `PaymentResponse`, the fields reconciliation sums. */
export interface PaymentSumDto {
  paymentId: string;
  purpose: 'CHECKOUT' | 'DEPOSIT' | 'REMAINDER' | 'REGISTRATION_FEE';
  referenceId: string;
  amount: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'DUPLICATE';
  paidAt: string | null;
}

interface PageDto<T> {
  content: T[];
}

/** Far above the orders of the pilot; the money screens have no paging UI. */
const PAGE_SIZE = 200;

export const ledgerPath = (orderId: string) => `${ledgersPath}/${encodeURIComponent(orderId)}`;

/** Vendor owner: their Shop's ledgers (`vendorId`). Admin: all, or `payableOnly` (AC-48.1). */
export async function fetchLedgers(params: { vendorId?: string; payableOnly?: boolean } = {}): Promise<LedgerDto[]> {
  const res = await apiClient.get<ApiResponse<PageDto<LedgerDto>>>(ledgersPath, { params: { ...params, size: PAGE_SIZE } });
  return res.data.data.content ?? [];
}

export async function fetchLedgerDisbursements(orderId: string): Promise<DisbursementDto[]> {
  const res = await apiClient.get<ApiResponse<DisbursementDto[]>>(`${ledgerPath(orderId)}/disbursements`);
  return res.data.data ?? [];
}

/** Every disbursement asked on the custom orders among `ledgers`, newest first. */
export async function fetchDisbursementsOf(ledgers: LedgerDto[]): Promise<DisbursementDto[]> {
  const lists = await Promise.all(ledgers.filter((l) => l.kind === 'CUSTOM_ORDER').map((l) => fetchLedgerDisbursements(l.orderId)));
  return lists.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Orders of a Shop (or all, for an admin) by id, without their lines. */
export async function fetchOrderMoney(vendorId?: string): Promise<Map<string, OrderMoneyDto>> {
  const res = await apiClient.get<ApiResponse<PageDto<OrderMoneyDto>>>(ordersPath, { params: { vendorId, size: PAGE_SIZE } });
  return new Map((res.data.data.content ?? []).map((o) => [o.id, o]));
}

/** Admin: the payments collected (AC-51.3). */
export async function fetchPayments(): Promise<PaymentSumDto[]> {
  const res = await apiClient.get<ApiResponse<PageDto<PaymentSumDto>>>(paymentsPath, { params: { size: PAGE_SIZE } });
  return res.data.data.content ?? [];
}
